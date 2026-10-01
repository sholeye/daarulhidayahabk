import React, { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useAuth } from "@/features/auth/AuthContext";
import { useSharedData } from "@/contexts/SharedDataContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Notice = {
  id: string;
  class_id: string;
  title: string;
  body: string;
  created_at: string;
};

export const LearnerNotices: React.FC = () => {
  const { user } = useAuth();
  const { students, schoolClasses } = useSharedData();
  const student =
    students.length === 1
      ? students[0]
      : students.find((item) => item.email === user?.email);
  const assignedClass = schoolClasses.find(
    (item) => item.name === student?.class,
  );
  const assignedClassId = assignedClass?.id;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!assignedClassId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("instructor_notices")
        .select("id, class_id, title, body, created_at")
        .eq("class_id", assignedClassId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error(error.message || "Unable to load class notices.");
      else setNotices((data || []) as Notice[]);
      setIsLoading(false);
    };
    void load();
    const channel = supabase
      .channel(`learner-notices-${assignedClassId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instructor_notices",
          filter: `class_id=eq.${assignedClassId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [assignedClassId]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Class Notices
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Updates from your instructor for {student?.class || "your class"}.
        </p>
      </header>
      {!student ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Your student record is not available.
        </div>
      ) : isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading notices...
        </p>
      ) : notices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No notices for your class yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FiBell />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground">
                    {notice.title}
                  </h2>
                  <time className="mt-1 block text-xs text-muted-foreground">
                    {new Date(notice.created_at).toLocaleString()}
                  </time>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {notice.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
