export const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? "2005";
export const ATTENDANCE_SESSION_KEY = "dh_meeting_attendance_session";
export const ATTENDANCE_PHONE_KEY = "dh_meeting_attendance_phone";

export type AttendanceLifecycleStatus =
  | "No Record"
  | "Signed In"
  | "Sign-Out Enabled"
  | "Signed Out";

export interface MeetingAttendanceRecord {
  id: string;
  session_token: string;
  first_name: string;
  last_name: string;
  parent_type?: string | null;
  phone_number: string;
  normalized_phone: string;
  number_of_children: number;
  is_parent: boolean;
  representative_relationship: string | null;
  parent_absence_reason: string | null;
  children: string[];
  selfie_path: string | null;
  selfie_url?: string | null;
  signed_in_at: string | null;
  signed_out_at: string | null;
  sign_out_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const normalizePhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");

  if (!cleaned) return "";

  if (cleaned.startsWith("234")) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `+234${cleaned.slice(1)}`;
  }

  if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }

  return `+${cleaned}`;
};

export const sanitizeName = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const formatMeetingTime = (value: string | null | undefined): string => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const getAttendanceStatus = (
  record: MeetingAttendanceRecord | null,
): AttendanceLifecycleStatus => {
  if (!record) return "No Record";
  if (record.signed_out_at) return "Signed Out";
  if (record.sign_out_enabled) return "Sign-Out Enabled";
  if (record.signed_in_at) return "Signed In";
  return "No Record";
};

export const getAttendanceSummaryLabel = (
  record: MeetingAttendanceRecord | null,
): string => {
  const status = getAttendanceStatus(record);

  if (status === "Signed In")
    return "Your attendance has already been recorded. Sign-out will become available after the meeting administrator enables it.";
  if (status === "Sign-Out Enabled")
    return "Your sign-out has been enabled by the administrator. You can now sign out from this page.";
  if (status === "Signed Out")
    return "Your attendance is complete. The sign-out time has been recorded.";
  return "Your attendance has already been recorded.";
};

export const getStorageSignedUrl = async (
  bucket: string,
  path: string,
): Promise<string | null> => {
  if (!path) return null;

  const { data, error } = await import("@/lib/supabase").then(({ supabase }) =>
    supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 12),
  );

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
};
