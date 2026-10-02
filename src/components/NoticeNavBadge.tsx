import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const NoticeNavBadge: React.FC = () => {
  const [count, setCount] = useState(0);
  const loadCount = useCallback(async () => {
    const { data, error } = await supabase.rpc(
      "get_unread_instructor_notice_count",
    );
    if (!error) setCount(Number(data) || 0);
  }, []);

  useEffect(() => {
    void loadCount();
    const refresh = window.setInterval(loadCount, 30000);
    const channel = supabase
      .channel("learner-notice-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructor_notices" },
        () => void loadCount(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructor_notice_reads" },
        () => void loadCount(),
      )
      .subscribe();
    return () => {
      window.clearInterval(refresh);
      void supabase.removeChannel(channel);
    };
  }, [loadCount]);

  if (count <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground"
      aria-label={`${count} unread class notices`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};
