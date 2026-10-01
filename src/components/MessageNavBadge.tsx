import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const MessageNavBadge: React.FC = () => {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_unread_message_count");
    if (!error) setCount(Number(data) || 0);
  }, []);

  useEffect(() => {
    void loadCount();
    const timer = window.setInterval(loadCount, 15000);
    const channel = supabase
      .channel("message-nav-unread-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          void loadCount();
        },
      )
      .subscribe();
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadCount]);

  if (count === 0) return null;

  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground"
      aria-label={`${count} unread messages`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};
