import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { attendanceRegistrationSchema } from "@/validators/schemas";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/features/common/Navbar";
import { Footer } from "@/features/common/Footer";
import {
  ATTENDANCE_PHONE_KEY,
  ATTENDANCE_SESSION_KEY,
  MeetingAttendanceRecord,
  formatMeetingTime,
  getAttendanceStatus,
  getAttendanceSummaryLabel,
  normalizePhoneNumber,
  sanitizeName,
} from "@/lib/attendance";

type ChildField = { id: string; name: string };
type MeetingSettings = {
  sign_in_enabled: boolean;
  sign_out_enabled: boolean;
};

const MEETING_SIGN_IN_KEY = "dh_meeting_sign_in_enabled";
const MEETING_SIGN_OUT_KEY = "dh_meeting_sign_out_enabled";

const generateUuid = (): string => {
  const cryptoImplementation =
    typeof window !== "undefined"
      ? (window.crypto ?? globalThis.crypto)
      : globalThis.crypto;

  if (
    cryptoImplementation &&
    typeof cryptoImplementation.randomUUID === "function"
  ) {
    return cryptoImplementation.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const randomValue = (Math.random() * 16) | 0;
    const value = char === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
};

const generateId = (): string => {
  return generateUuid();
};

const createChildField = (name = ""): ChildField => ({
  id: generateId(),
  name,
});

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = source;
  });

const compressImage = async (file: File): Promise<File> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image."));
      img.src = objectUrl;
    });

    const imageElement = image as HTMLImageElement;
    const sourceWidth = imageElement.naturalWidth || imageElement.width || 0;
    const sourceHeight = imageElement.naturalHeight || imageElement.height || 0;

    if (!sourceWidth || !sourceHeight) {
      return file;
    }

    const canvas = document.createElement("canvas");
    const maxDimension = 1280;
    const scale = Math.min(
      1,
      maxDimension / Math.max(sourceWidth, sourceHeight),
    );

    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob) return file;

    return new File([blob], "selfie.jpg", { type: "image/jpeg" });
  } catch (error) {
    console.error("Image decode failed", error);
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [parentType, setParentType] = useState<"father" | "mother" | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberOfChildren, setNumberOfChildren] = useState("1");
  const [isParent, setIsParent] = useState<boolean | null>(null);
  const [relationship, setRelationship] = useState("");
  const [relationshipOther, setRelationshipOther] = useState("");
  const [parentAbsenceReason, setParentAbsenceReason] = useState("");
  const [children, setChildren] = useState<ChildField[]>([createChildField()]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings>({
    sign_in_enabled: true,
    sign_out_enabled: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] =
    useState<MeetingAttendanceRecord | null>(null);
  const [existingLookupInProgress, setExistingLookupInProgress] =
    useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraError(null);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "This device does not support camera capture. Please use Upload Selfie instead.",
      );
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setCameraError("Camera preview is not ready yet.");
        return;
      }

      cameraStreamRef.current = stream;
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.style.display = "block";

      await new Promise<void>((resolve) => {
        const finish = async () => {
          video.onloadedmetadata = null;
          video.onloadeddata = null;
          try {
            await video.play();
          } catch {
            // Some browsers require user interaction before playback begins.
          }
          resolve();
        };

        video.onloadedmetadata = finish;
        video.onloadeddata = finish;

        requestAnimationFrame(() => {
          void video.play().catch(() => undefined);
        });
      });

      setCameraOpen(true);
    } catch (error) {
      console.error("Camera access failed", error);
      setCameraError(
        "Camera access was denied or is unavailable. Please allow camera permission or use Upload Selfie instead.",
      );
      setCameraOpen(false);
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject || video.readyState < 2) {
      setCameraError(
        "Camera preview is still warming up. Please wait a moment.",
      );
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("This browser cannot capture a selfie right now.");
      return;
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture the selfie. Please try again.");
          return;
        }

        setPhotoFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
        stopCamera();
      },
      "image/jpeg",
      0.82,
    );
  };

  useEffect(() => {
    const parsedCount = Number(numberOfChildren);
    if (!Number.isInteger(parsedCount) || parsedCount < 1) return;

    setChildren((previous) => {
      const next = [...previous];

      while (next.length < parsedCount) {
        next.push(createChildField());
      }

      return next.slice(0, parsedCount);
    });
  }, [numberOfChildren]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  useEffect(() => {
    const loadMeetingSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("meeting_settings")
          .select("sign_in_enabled, sign_out_enabled")
          .maybeSingle();

        if (error) {
          throw error;
        }

        setMeetingSettings({
          sign_in_enabled: data?.sign_in_enabled ?? true,
          sign_out_enabled: data?.sign_out_enabled ?? false,
        });
      } catch (error) {
        console.error("Failed to load meeting settings", error);
        setMeetingSettings({ sign_in_enabled: true, sign_out_enabled: false });
      } finally {
        setSettingsLoading(false);
      }
    };

    void loadMeetingSettings();

    return () => {
      stopCamera();
    };
  }, []);

  const loadExistingRecord = async () => {
    try {
      const savedSession = window.localStorage.getItem(ATTENDANCE_SESSION_KEY);
      if (savedSession) {
        const { data, error } = await supabase
          .from("meeting_attendance")
          .select("*")
          .eq("session_token", savedSession)
          .maybeSingle();

        if (!error && data) {
          setCurrentRecord(data as MeetingAttendanceRecord);
          setExistingLookupInProgress(false);
          return;
        }
      }

      const savedPhone = window.localStorage.getItem(ATTENDANCE_PHONE_KEY);
      if (savedPhone) {
        const normalized = normalizePhoneNumber(savedPhone);
        const { data, error } = await supabase
          .from("meeting_attendance")
          .select("*")
          .eq("normalized_phone", normalized)
          .order("signed_in_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setCurrentRecord(data as MeetingAttendanceRecord);
          if (data.session_token) {
            window.localStorage.setItem(
              ATTENDANCE_SESSION_KEY,
              data.session_token,
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to load existing record", error);
    } finally {
      setExistingLookupInProgress(false);
    }
  };

  useEffect(() => {
    void loadExistingRecord();
  }, []);

  const attendeeStatus = useMemo(
    () => getAttendanceStatus(currentRecord),
    [currentRecord],
  );
  const signOutAvailable = Boolean(
    currentRecord &&
    currentRecord.signed_in_at &&
    !currentRecord.signed_out_at &&
    (currentRecord.sign_out_enabled || meetingSettings.sign_out_enabled),
  );
  const currentChildrenText = currentRecord?.children?.join(", ") ?? "";

  const openMediaPicker = (mode: "upload" | "camera") => {
    if (mode === "camera") {
      void openCamera();
      return;
    }

    if (!fileInputRef.current) return;

    fileInputRef.current.value = "";
    fileInputRef.current.accept = "image/*";
    fileInputRef.current.removeAttribute("capture");
    fileInputRef.current.click();
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;

    const isValidType = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ].includes(selected.type);
    if (!isValidType) {
      toast.error("Please upload a valid image file (jpg, jpeg, png or webp).");
      event.target.value = "";
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error(
        "This image is too large. Please choose another image under 5MB.",
      );
      event.target.value = "";
      return;
    }

    setPhotoFile(selected);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (settingsLoading) {
      toast.info("Checking meeting status, please wait a moment.");
      return;
    }

    if (!meetingSettings.sign_in_enabled) {
      toast.error("Sign-in is currently closed. Please try again later.");
      return;
    }

    if (
      currentRecord &&
      currentRecord.signed_in_at &&
      !currentRecord.signed_out_at
    ) {
      toast.info(
        "Your attendance has already been recorded. Please wait for sign-out approval.",
      );
      return;
    }

    if (isParent === null) {
      toast.error(
        "Please select whether you are the parent or representing the parent.",
      );
      return;
    }

    const parsedChildrenCount = Number(numberOfChildren);
    if (!Number.isInteger(parsedChildrenCount) || parsedChildrenCount < 1) {
      toast.error("Please enter a valid number of children enrolled.");
      return;
    }

    const trimmedChildren = children
      .map((child) => sanitizeName(child.name))
      .filter(Boolean);

    if (trimmedChildren.length === 0) {
      toast.error("Please add at least one child name.");
      return;
    }

    if (isParent && !parentType) {
      toast.error("Please select a parent type before continuing.");
      return;
    }

    const payload = {
      first_name: sanitizeName(firstName),
      last_name: sanitizeName(lastName),
      parent_type: isParent ? parentType || null : null,
      phone_number: phoneNumber,
      number_of_children: parsedChildrenCount,
      is_parent: isParent,
      representative_relationship: isParent
        ? null
        : relationship === "Other"
          ? relationshipOther
          : relationship,
      parent_absence_reason: isParent ? null : parentAbsenceReason,
      children: trimmedChildren,
    };

    const validation = attendanceRegistrationSchema.safeParse({
      ...payload,
      child_names: trimmedChildren,
    });

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      toast.error(
        firstIssue?.message || "Please check the form and try again.",
      );
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    const { data: duplicateData, error: duplicateError } = await supabase
      .from("meeting_attendance")
      .select(
        "id, session_token, signed_in_at, signed_out_at, sign_out_enabled",
      )
      .eq("normalized_phone", normalizedPhone)
      .order("signed_in_at", { ascending: false })
      .limit(1);

    if (duplicateError) {
      const tableMissing =
        duplicateError.message.toLowerCase().includes("does not exist") ||
        duplicateError.message.toLowerCase().includes("relation") ||
        duplicateError.message.toLowerCase().includes("not found");

      toast.error(
        tableMissing
          ? "Attendance tables are not ready in Supabase yet. Run the SQL setup script in the Supabase SQL editor before signing in."
          : "We could not verify your attendance status right now. Please try again.",
      );
      return;
    }

    if ((duplicateData ?? []).length > 0) {
      const existing = duplicateData[0];
      const savedToken = existing.session_token ?? "";
      if (savedToken) {
        localStorage.setItem(ATTENDANCE_SESSION_KEY, savedToken);
      }
      localStorage.setItem(ATTENDANCE_PHONE_KEY, normalizedPhone);
      const nextRecord = { ...existing } as MeetingAttendanceRecord;
      setCurrentRecord(nextRecord);
      toast.info(
        "Your attendance has already been recorded. Please wait for administrator approval before signing out.",
      );
      return;
    }

    setLoading(true);

    try {
      const safeSessionToken = generateUuid();
      let storagePath: string | null = null;

      if (photoFile) {
        const compressedFile = await compressImage(photoFile);
        storagePath = `attendance/${safeSessionToken}/selfie.jpg`;
        const uploadResult = await supabase.storage
          .from("attendance-photos")
          .upload(storagePath, compressedFile, {
            upsert: false,
            contentType: "image/jpeg",
          });

        if (uploadResult.error) {
          throw new Error(uploadResult.error.message);
        }
      }

      const insertPayload = {
        session_token: safeSessionToken,
        first_name: payload.first_name,
        last_name: payload.last_name,
        parent_type: payload.parent_type,
        phone_number: normalizedPhone,
        normalized_phone: normalizedPhone,
        number_of_children: payload.number_of_children,
        is_parent: payload.is_parent,
        representative_relationship: payload.representative_relationship,
        parent_absence_reason: payload.parent_absence_reason,
        children: payload.children,
        selfie_path: storagePath,
        sign_out_enabled: false,
      };

      const { data, error } = await supabase
        .from("meeting_attendance")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error || !data) {
        throw new Error(error?.message || "The sign-in could not be saved.");
      }

      localStorage.setItem(ATTENDANCE_SESSION_KEY, data.session_token);
      localStorage.setItem(ATTENDANCE_PHONE_KEY, normalizedPhone);
      setCurrentRecord(data as MeetingAttendanceRecord);
      toast.success("Attendance recorded successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit attendance. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (
      !currentRecord ||
      !(currentRecord.sign_out_enabled || meetingSettings.sign_out_enabled)
    ) {
      toast.error(
        "Sign-out is not available yet. Please wait for administrator approval.",
      );
      return;
    }

    if (currentRecord.signed_out_at) {
      toast.info("This attendance record has already been signed out.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        "set_meeting_attendance_signout",
        {
          attendance_id: currentRecord.id,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      const updatedRecord = Array.isArray(data)
        ? (data[0] ?? null)
        : (data ?? null);

      if (!updatedRecord || !updatedRecord.signed_out_at) {
        const { data: refreshed, error: refreshError } = await supabase
          .from("meeting_attendance")
          .select("*")
          .eq("id", currentRecord.id)
          .single();

        if (refreshError) {
          throw new Error(refreshError.message);
        }

        if (!refreshed?.signed_out_at) {
          throw new Error(
            "Sign-out was not saved to the database. Please try again.",
          );
        }

        setCurrentRecord(refreshed as MeetingAttendanceRecord);
      } else {
        setCurrentRecord(updatedRecord as MeetingAttendanceRecord);
      }

      toast.success("Sign-out recorded successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to record sign-out. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (existingLookupInProgress || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Checking your attendance status...
          </p>
        </div>
      </div>
    );
  }

  if (
    currentRecord &&
    currentRecord.signed_in_at &&
    !currentRecord.signed_out_at
  ) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="mx-auto max-w-2xl space-y-6 px-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Parent/Teacher Meeting Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge
                  variant={
                    attendeeStatus === "Sign-Out Enabled"
                      ? "success"
                      : "secondary"
                  }
                >
                  {attendeeStatus}
                </Badge>
                <p className="text-muted-foreground">
                  {getAttendanceSummaryLabel(currentRecord)}
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Signed in</p>
                  <p className="text-lg font-semibold">
                    {formatMeetingTime(currentRecord.signed_in_at)}
                  </p>
                </div>
                {signOutAvailable ? (
                  <Button
                    onClick={handleSignOut}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Recording sign-out..." : "Sign Out"}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                    Your sign-out will become available after the meeting
                    administrator enables it.
                  </div>
                )}
                <div className="pt-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Registered attendee
                  </p>
                  <p>
                    {currentRecord.first_name} {currentRecord.last_name}
                  </p>
                  <p>{currentRecord.phone_number}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (currentRecord && currentRecord.signed_out_at) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="mx-auto max-w-2xl px-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Thank You for Joining Us Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant="success">Signed Out</Badge>
                <p className="text-base text-muted-foreground">
                  We truly appreciate your time and presence at today’s meeting.
                  Thank you for attending and supporting the session.
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Signed in</p>
                  <p className="font-semibold">
                    {formatMeetingTime(currentRecord.signed_in_at)}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Signed out
                  </p>
                  <p className="font-semibold">
                    {formatMeetingTime(currentRecord.signed_out_at)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Attendee: {currentRecord.first_name} {currentRecord.last_name}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-12 pt-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-6 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Parent/Teacher Meeting
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Attendance Sign-In
            </h1>
            <p className="mt-2 text-muted-foreground">
              Please complete the form below to record your sign-in attendance.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form className="space-y-6" onSubmit={handleRegister}>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="mb-3 text-base font-medium">
                    Are you the parent of the child/children you are
                    registering?
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant={isParent === true ? "default" : "outline"}
                      onClick={() => setIsParent(true)}
                    >
                      Yes, I am the parent
                    </Button>
                    <Button
                      type="button"
                      variant={isParent === false ? "default" : "outline"}
                      onClick={() => setIsParent(false)}
                    >
                      No, I am representing the parent
                    </Button>
                  </div>
                </div>

                {isParent === true && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Parent Type
                      </label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={parentType}
                        onChange={(event) =>
                          setParentType(
                            event.target.value as "father" | "mother" | "",
                          )
                        }
                      >
                        <option value="">Select parent type</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                      </select>
                    </div>
                    <div />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Phone Number
                    </label>
                    <Input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="08012345678"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Number of enrolled Children
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={numberOfChildren}
                      onChange={(event) =>
                        setNumberOfChildren(event.target.value)
                      }
                    />
                  </div>
                </div>

                {isParent === false && (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        What is your relationship to the parent you are
                        representing?
                      </label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={relationship}
                        onChange={(event) =>
                          setRelationship(event.target.value)
                        }
                      >
                        <option value="">Select an option</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Relative">Relative</option>
                        <option value="Older sibling">Older sibling</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {relationship === "Other" && (
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Please specify
                        </label>
                        <Input
                          value={relationshipOther}
                          onChange={(event) =>
                            setRelationshipOther(event.target.value)
                          }
                          placeholder="Relationship"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Why is the parent unable to attend?
                      </label>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-input bg-background p-3 text-sm"
                        value={parentAbsenceReason}
                        onChange={(event) =>
                          setParentAbsenceReason(event.target.value)
                        }
                        placeholder="Explain the reason"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Children Represented
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setChildren((current) => [
                          ...current,
                          createChildField(),
                        ])
                      }
                    >
                      Add Child
                    </Button>
                  </div>

                  {children.map((child, index) => (
                    <div key={child.id} className="flex gap-2">
                      <Input
                        value={child.name}
                        onChange={(event) => {
                          const next = [...children];
                          const target = next.find(
                            (item) => item.id === child.id,
                          );
                          if (!target) return;
                          target.name = event.target.value;
                          setChildren(next);
                        }}
                        placeholder={`Child ${index + 1} name`}
                      />
                      {children.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setChildren((current) =>
                              current.filter((item) => item.id !== child.id),
                            )
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <label className="mb-2 block text-sm font-medium">
                    Selfie / Attendance Photo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleFileSelection}
                  />

                  {cameraOpen && (
                    <div className="mb-4 space-y-3 rounded-xl border border-border bg-background p-3">
                      <div className="overflow-hidden rounded-lg bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-64 w-full object-cover"
                        />
                      </div>
                      {cameraError ? (
                        <p className="text-sm text-destructive">
                          {cameraError}
                        </p>
                      ) : null}
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          className="flex-1"
                          onClick={captureSelfie}
                        >
                          Capture Selfie
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={stopCamera}
                        >
                          Close Camera
                        </Button>
                      </div>
                    </div>
                  )}

                  {photoPreview ? (
                    <div className="space-y-3">
                      <img
                        src={photoPreview}
                        alt="Attendance preview"
                        className="h-56 w-full rounded-lg object-cover"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openMediaPicker("upload")}
                        >
                          Upload Selfie
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setPhotoFile(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openMediaPicker("upload")}
                      >
                        Upload Selfie
                      </Button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting attendance..." : "Submit Attendance"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
