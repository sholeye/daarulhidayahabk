import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  ADMIN_PIN,
  MeetingAttendanceRecord,
  formatMeetingTime,
  getAttendanceStatus,
} from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type SortMode =
  | "all"
  | "arrival_latest"
  | "arrival_earliest"
  | "name_asc"
  | "name_desc"
  | "parents_only"
  | "representatives_only";

type MeetingSettings = {
  sign_in_enabled: boolean;
  sign_out_enabled: boolean;
};

const statusColors: Record<
  string,
  "success" | "secondary" | "default" | "destructive"
> = {
  "Signed In": "secondary",
  "Sign-Out Enabled": "success",
  "Signed Out": "default",
  "No Record": "destructive",
};

const CheckPage: React.FC = () => {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [records, setRecords] = useState<MeetingAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Signed In" | "Signed Out"
  >("all");
  const [childrenPopup, setChildrenPopup] = useState<{
    name: string;
    children: string[];
  } | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [meetingSettings, setMeetingSettings] = useState<MeetingSettings>({
    sign_in_enabled: true,
    sign_out_enabled: false,
  });

  const normalizeMeetingSettings = (
    nextSignIn: boolean,
    nextSignOut: boolean,
  ): MeetingSettings => {
    if (nextSignIn && nextSignOut) {
      return { sign_in_enabled: true, sign_out_enabled: false };
    }

    return { sign_in_enabled: nextSignIn, sign_out_enabled: nextSignOut };
  };

  const loadMeetingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("meeting_settings")
        .select("sign_in_enabled, sign_out_enabled")
        .maybeSingle();

      if (error) {
        throw error;
      }

      const nextSettings = normalizeMeetingSettings(
        Boolean(data?.sign_in_enabled ?? true),
        Boolean(data?.sign_out_enabled ?? false),
      );

      setMeetingSettings(nextSettings);
    } catch (error) {
      console.error("Unable to load meeting settings", error);
      setMeetingSettings({ sign_in_enabled: true, sign_out_enabled: false });
    }
  };

  const updateMeetingSettings = async (
    nextSignIn: boolean,
    nextSignOut: boolean,
  ) => {
    const normalized = normalizeMeetingSettings(nextSignIn, nextSignOut);

    try {
      const { data, error } = await supabase
        .from("meeting_settings")
        .upsert(
          {
            id: 1,
            sign_in_enabled: normalized.sign_in_enabled,
            sign_out_enabled: normalized.sign_out_enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("sign_in_enabled, sign_out_enabled")
        .single();

      if (error) {
        throw error;
      }

      const nextSettings = data ?? normalized;

      setMeetingSettings({
        sign_in_enabled: nextSettings.sign_in_enabled,
        sign_out_enabled: nextSettings.sign_out_enabled,
      });

      toast.success(
        `Meeting settings updated. Sign-in: ${normalized.sign_in_enabled ? "enabled" : "disabled"}; Sign-out: ${normalized.sign_out_enabled ? "enabled" : "disabled"}.`,
        { duration: 15000 },
      );
    } catch (error) {
      console.error("Unable to update meeting settings", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update meeting settings.",
        { duration: 15000 },
      );
    }
  };

  const toggleSignIn = () => {
    if (meetingSettings.sign_in_enabled) {
      void updateMeetingSettings(false, false);
      return;
    }

    void updateMeetingSettings(true, false);
  };

  const toggleSignOut = () => {
    if (meetingSettings.sign_out_enabled) {
      void updateMeetingSettings(false, false);
      return;
    }

    void updateMeetingSettings(false, true);
  };

  const loadRecords = async (nextSortMode: SortMode = sortMode) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meeting_attendance")
        .select("*")
        .order("signed_in_at", {
          ascending: nextSortMode === "arrival_earliest",
        });

      if (error) {
        throw new Error(error.message);
      }

      const resolvedRows = await Promise.all(
        (data ?? []).map(async (row: MeetingAttendanceRecord) => {
          if (!row.selfie_path) return { ...row, selfie_url: null };

          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("attendance-photos")
              .createSignedUrl(row.selfie_path, 60 * 60 * 12);

          return {
            ...row,
            selfie_url:
              signedUrlError || !signedUrlData ? null : signedUrlData.signedUrl,
          };
        }),
      );

      setRecords(resolvedRows as MeetingAttendanceRecord[]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load attendance records.",
        {
          duration: 15000,
        },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      void loadMeetingSettings();
      void loadRecords();
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (isUnlocked) {
      void loadRecords(sortMode);
    }
  }, [sortMode]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = [...records];

    rows.sort((a, b) => {
      const timeA = new Date(a.signed_in_at ?? 0).getTime();
      const timeB = new Date(b.signed_in_at ?? 0).getTime();

      if (sortMode === "name_asc") {
        return `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`,
        );
      }

      if (sortMode === "name_desc") {
        return `${b.first_name} ${b.last_name}`.localeCompare(
          `${a.first_name} ${a.last_name}`,
        );
      }

      if (sortMode === "arrival_earliest") {
        return timeA - timeB;
      }

      return timeB - timeA;
    });

    return rows.filter((record) => {
      const status = record.signed_out_at
        ? "Signed Out"
        : record.signed_in_at
          ? "Signed In"
          : "No Record";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !query ||
        [
          record.first_name,
          record.last_name,
          record.phone_number,
          record.normalized_phone,
          record.children.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      if (sortMode === "parents_only") {
        return matchesStatus && matchesSearch && record.is_parent;
      }

      if (sortMode === "representatives_only") {
        return matchesStatus && matchesSearch && !record.is_parent;
      }

      return matchesStatus && matchesSearch;
    });
  }, [records, search, statusFilter, sortMode]);

  const summary = useMemo(() => {
    const total = records.length;
    const signedIn = records.filter(
      (record) => record.signed_in_at && !record.signed_out_at,
    ).length;
    const signedOut = records.filter((record) => record.signed_out_at).length;

    return { total, signedIn, signedOut };
  }, [records]);

  const handleUnlock = () => {
    if (pin === ADMIN_PIN) {
      setIsUnlocked(true);
      setPin("");
      return;
    }

    toast.error("Incorrect PIN.", { duration: 15000 });
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Admin Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 4-digit admin PIN to continue.
              </p>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="••••"
              />
              <Button className="w-full" onClick={handleUnlock}>
                Unlock Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Meeting Attendance</h1>
          </div>
          <Button variant="outline" onClick={() => void loadRecords(sortMode)}>
            Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Meeting controls
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="min-w-[88px] text-sm font-medium">
                  Sign-In:{" "}
                  {meetingSettings.sign_in_enabled ? "ENABLED" : "DISABLED"}
                </span>
                <Switch
                  checked={meetingSettings.sign_in_enabled}
                  onCheckedChange={(nextValue) =>
                    void updateMeetingSettings(nextValue, false)
                  }
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="min-w-[96px] text-sm font-medium">
                  Sign-Out:{" "}
                  {meetingSettings.sign_out_enabled ? "ENABLED" : "DISABLED"}
                </span>
                <Switch
                  checked={meetingSettings.sign_out_enabled}
                  onCheckedChange={(nextValue) =>
                    void updateMeetingSettings(false, nextValue)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total attendees</p>
              <p className="mt-2 text-3xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Currently signed in
              </p>
              <p className="mt-2 text-3xl font-bold">{summary.signedIn}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Signed out</p>
              <p className="mt-2 text-3xl font-bold">{summary.signedOut}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:max-w-xs"
            placeholder="Search attendee"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "Signed In" | "Signed Out",
              )
            }
          >
            <option value="all">All statuses</option>
            <option value="Signed In">Signed In</option>
            <option value="Signed Out">Signed Out</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="all">All records</option>
            <option value="arrival_latest">Arrival time: newest first</option>
            <option value="arrival_earliest">
              Arrival time: earliest first
            </option>
            <option value="name_asc">Name: A–Z</option>
            <option value="name_desc">Name: Z–A</option>
            <option value="parents_only">Parents only</option>
            <option value="representatives_only">Representatives only</option>
          </select>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading attendance records…
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Sign In</th>
                  <th className="px-4 py-3 font-semibold">Sign Out</th>
                  <th className="px-4 py-3 font-semibold">Parent</th>
                  <th className="px-4 py-3 font-semibold">Children</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const status = record.signed_out_at
                    ? "Signed Out"
                    : record.signed_in_at
                      ? "Signed In"
                      : "No Record";

                  return (
                    <tr
                      key={record.id}
                      className="border-t border-border align-center"
                    >
                      <td className="px-4 py-3 ">
                        <Link to={`/check/${record.id}`} className="block">
                          {record.selfie_url ? (
                            <img
                              src={record.selfie_url}
                              alt="Attendee selfie"
                              className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
                              onError={(event) => {
                                const target =
                                  event.currentTarget as HTMLImageElement;
                                target.src =
                                  "data:image/svg+xml;charset=utf-8," +
                                  encodeURIComponent(
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#f5f5f5"/><circle cx="60" cy="44" r="18" fill="#d4d4d4"/><path d="M40 92c8-16 32-16 40 0" fill="#d4d4d4"/></svg>',
                                  );
                              }}
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {record.first_name.charAt(0)}
                              {record.last_name.charAt(0)}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/check/${record.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {record.first_name} {record.last_name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {record.is_parent ? "Parent" : "Representative"}
                        </div>
                      </td>
                      <td className="px-4 py-3">{record.phone_number}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[status] ?? "secondary"}>
                          {status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {formatMeetingTime(record.signed_in_at)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMeetingTime(record.signed_out_at)}
                      </td>
                      <td className="px-4 py-3">
                        {record.parent_type ||
                          (record.is_parent ? "Parent" : "Representative")}
                      </td>
                      <td className="px-4 py-3">
                        {record.children && record.children.length > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setChildrenPopup({
                                name: `${record.first_name} ${record.last_name}`,
                                children: record.children,
                              })
                            }
                          >
                            View Children
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {childrenPopup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{childrenPopup.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChildrenPopup(null)}
                >
                  Close
                </Button>
              </div>

              <ul className="space-y-2">
                {childrenPopup.children.map((child, index) => (
                  <li
                    key={`${childrenPopup.name}-${index}`}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    {child}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CheckPage;
