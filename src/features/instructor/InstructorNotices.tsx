import React, { useEffect, useMemo, useState } from "react";
import { FiBell, FiPlus, FiTrash2 } from "react-icons/fi";
import { useAuth } from "@/features/auth/AuthContext";
import { useSharedData } from "@/contexts/SharedDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Notice = {
  id: string;
  class_id: string;
  instructor_id: string;
  title: string;
  body: string;
  created_at: string;
};

export const InstructorNotices: React.FC = () => {
  const { user } = useAuth();
  const { schoolClasses } = useSharedData();
  const assignedClasses = useMemo(
    () => schoolClasses.filter((item) => item.instructorId === user?.id),
    [schoolClasses, user?.id],
  );
  const [notices, setNotices] = useState<Notice[]>([]);
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Notice | null>(null);

  useEffect(() => {
    if (!classId && assignedClasses[0]) setClassId(assignedClasses[0].id);
  }, [assignedClasses, classId]);

  const loadNotices = async () => {
    const { data, error } = await supabase
      .from("instructor_notices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message || "Unable to load notices.");
    else setNotices((data || []) as Notice[]);
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !assignedClasses.some((item) => item.id === classId)) return;
    setIsSaving(true);
    const { error } = await supabase.from("instructor_notices").insert({
      class_id: classId,
      instructor_id: user.id,
      title: title.trim(),
      body: body.trim(),
    });
    setIsSaving(false);
    if (error) {
      toast.error(error.message || "Unable to publish notice.");
      return;
    }
    toast.success("Notice sent to the selected class.");
    setTitle("");
    setBody("");
    await loadNotices();
  };

  const remove = async (notice: Notice) => {
    const { error } = await supabase
      .from("instructor_notices")
      .delete()
      .eq("id", notice.id);
    if (error) toast.error(error.message || "Unable to delete notice.");
    else {
      setNotices((previous) =>
        previous.filter((item) => item.id !== notice.id),
      );
      setPendingDelete(null);
      toast.success("Notice deleted.");
    }
  };

  const className = (id: string) =>
    assignedClasses.find((item) => item.id === id)?.name || "Class";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Class Notices
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish updates to all learners in one assigned class.
        </p>
      </header>
      {assignedClasses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No classes are assigned to you yet.
        </div>
      ) : (
        <form
          onSubmit={publish}
          className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6"
        >
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <FiPlus />
            Write a notice
          </h2>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            Class
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3"
              required
            >
              {assignedClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            Title
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              required
            />
          </label>
          <label className="block space-y-2 text-sm font-medium text-foreground">
            Notice
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={10000}
              rows={5}
              className="resize-y"
              required
            />
          </label>
          <Button
            type="submit"
            disabled={isSaving || !title.trim() || !body.trim()}
          >
            <FiBell />
            {isSaving ? "Publishing..." : "Publish to class"}
          </Button>
        </form>
      )}
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Recent notices</h2>
        {notices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            No notices published yet.
          </div>
        ) : (
          notices.map((notice) => (
            <article
              key={notice.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words font-semibold text-foreground">
                    {notice.title}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                    {className(notice.class_id)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {notice.body}
                </p>
                <time className="mt-3 block text-xs text-muted-foreground">
                  {new Date(notice.created_at).toLocaleString()}
                </time>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="self-start text-destructive"
                onClick={() => setPendingDelete(notice)}
                aria-label="Delete notice"
              >
                <FiTrash2 />
              </Button>
            </article>
          ))
        )}
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete notice?"
        description="Learners will no longer see this class notice."
        confirmLabel="Delete notice"
        variant="destructive"
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
      />
    </div>
  );
};
