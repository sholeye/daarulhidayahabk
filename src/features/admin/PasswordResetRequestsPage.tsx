import React, { useCallback, useEffect, useState } from "react";
import { FiCheck, FiClock, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PasswordResetRequest = {
  id: string;
  student_id: string;
  status: "pending" | "completed" | "rejected";
  requested_at: string;
  students: { full_name: string; email: string };
};

export const PasswordResetRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("password_reset_requests")
      .select(
        "id, student_id, status, requested_at, students!inner(full_name, email)",
      )
      .order("requested_at", { ascending: false });
    if (error) {
      toast.error(error.message || "Unable to load password reset requests.");
      setIsLoading(false);
      return;
    }
    setRequests((data || []) as unknown as PasswordResetRequest[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const updateStatus = async (
    requestId: string,
    status: "completed" | "rejected",
  ) => {
    setSavingId(requestId);
    const { error } = await supabase
      .from("password_reset_requests")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) {
      toast.error(error.message || "Unable to update request.");
    } else {
      toast.success(
        status === "completed"
          ? "Request marked completed."
          : "Request rejected.",
      );
      await loadRequests();
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Password Reset Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review learner requests and update their status after handling the
          reset.
        </p>
      </header>
      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">
          Loading requests...
        </p>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No password reset requests.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground">
                  {request.students.full_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {request.students.email} · ID {request.student_id}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <FiClock />
                  {new Date(request.requested_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-medium capitalize text-primary">
                  {request.status}
                </p>
              </div>
              {request.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void updateStatus(request.id, "completed")}
                    disabled={savingId === request.id}
                  >
                    <FiCheck />
                    Mark handled
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void updateStatus(request.id, "rejected")}
                    disabled={savingId === request.id}
                  >
                    <FiX />
                    Reject
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
