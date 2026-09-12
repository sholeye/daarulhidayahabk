import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { MeetingAttendanceRecord, formatMeetingTime } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const AttendanceDetail: React.FC = () => {
  const { id } = useParams();
  const [record, setRecord] = useState<MeetingAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecord = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("meeting_attendance")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setRecord(null);
          return;
        }

        if (data.selfie_path) {
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("attendance-photos")
              .createSignedUrl(data.selfie_path, 60 * 60 * 12);

          setRecord({
            ...data,
            selfie_url:
              signedUrlError || !signedUrlData ? null : signedUrlData.signedUrl,
          } as MeetingAttendanceRecord);
          return;
        }

        setRecord(data as MeetingAttendanceRecord);
      } catch (error) {
        console.error("Failed to load attendee details", error);
        toast.error("Unable to load attendee details.");
      } finally {
        setLoading(false);
      }
    };

    void loadRecord();
  }, [id]);

  const status = useMemo(() => {
    if (!record) return "No Record";
    if (record.signed_out_at) return "Signed Out";
    if (record.signed_in_at) return "Signed In";
    return "No Record";
  }, [record]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="flex min-h-[220px] items-center justify-center text-muted-foreground">
              Loading attendee profile…
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h1 className="text-2xl font-bold">Attendee not found</h1>
              <p className="text-muted-foreground">
                This attendee record could not be found.
              </p>
              <Link to="/check">
                <Button variant="outline">Back to attendance list</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">
              Attendee Profile
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {record.first_name} {record.last_name}
            </h1>
          </div>
          <Link to="/check">
            <Button variant="outline">Back to list</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-[260px_1fr]">
            <div className="space-y-4">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
                {record.selfie_url ? (
                  <img
                    src={record.selfie_url}
                    alt="Attendee selfie"
                    className="h-full w-full rounded-[50%] object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                    No selfie uploaded
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Badge
                  variant={status === "Signed Out" ? "success" : "secondary"}
                >
                  {status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {record.parent_type ||
                    (record.is_parent ? "Parent" : "Representative")}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="mt-1 font-medium">{record.phone_number}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Children count
                  </p>
                  <p className="mt-1 font-medium">
                    {record.number_of_children}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Signed in</p>
                  <p className="mt-1 font-medium">
                    {formatMeetingTime(record.signed_in_at)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Signed out</p>
                  <p className="mt-1 font-medium">
                    {formatMeetingTime(record.signed_out_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Children</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {record.children && record.children.length > 0 ? (
                    record.children.map((child, index) => (
                      <li key={`${child}-${index}`}>{child}</li>
                    ))
                  ) : (
                    <li>No children listed</li>
                  )}
                </ul>
              </div>

              {!record.is_parent && (
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Representative relationship
                  </p>
                  <p className="mt-1 font-medium">
                    {record.representative_relationship || "Not provided"}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Parent absence reason
                  </p>
                  <p className="mt-1 font-medium">
                    {record.parent_absence_reason || "Not provided"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceDetail;
