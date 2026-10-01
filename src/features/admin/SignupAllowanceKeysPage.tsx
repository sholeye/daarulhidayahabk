import React, { useCallback, useEffect, useState } from "react";
import { FiCopy, FiKey, FiPlus, FiSlash } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { UserRole } from "@/types";

type AllowanceKey = {
  id: string;
  allowed_role: "parent" | "instructor";
  created_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
};

const createPlainKey = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `DH-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
};

const hashKey = async (key: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key.trim().toUpperCase()),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

export const SignupAllowanceKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<AllowanceKey[]>([]);
  const [role, setRole] = useState<"parent" | "instructor">("parent");
  const [newKey, setNewKey] = useState("");
  const [pendingRevoke, setPendingRevoke] = useState<AllowanceKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadKeys = useCallback(async () => {
    const { data, error } = await supabase
      .from("signup_allowance_keys")
      .select("id, allowed_role, created_at, redeemed_at, revoked_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message || "Unable to load allowance keys.");
    } else {
      setKeys((data || []) as AllowanceKey[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const createKey = async () => {
    setIsSaving(true);
    try {
      const plainKey = createPlainKey();
      const keyHash = await hashKey(plainKey);
      const { error } = await supabase.rpc("create_signup_allowance_key", {
        _key_hash: keyHash,
        _allowed_role: role as UserRole,
      });
      if (error) throw error;
      setNewKey(plainKey);
      toast.success(
        "Allowance key created. Copy it now; it is shown only once.",
      );
      await loadKeys();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create allowance key.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      toast.success("Key copied.");
    } catch {
      toast.error(
        "Clipboard access is unavailable. Select and copy the key manually.",
      );
    }
  };

  const revokeKey = async () => {
    if (!pendingRevoke) return;
    const { data, error } = await supabase
      .from("signup_allowance_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", pendingRevoke.id)
      .is("redeemed_at", null)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      toast.error(error.message || "Unable to revoke key.");
    } else if (!data) {
      toast.error("This key is already used or revoked.");
    } else {
      toast.success("Allowance key revoked.");
    }
    setPendingRevoke(null);
    await loadKeys();
  };

  const statusOf = (key: AllowanceKey) =>
    key.redeemed_at ? "Used" : key.revoked_at ? "Revoked" : "Available";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Signup Allowance Keys
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate role-specific, single-use keys for verified parents and
          instructors.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FiKey />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Create a key</h2>
            <p className="text-sm text-muted-foreground">
              The key is invalidated after one successful signup and can only be
              used for the selected role.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2 text-sm font-medium text-foreground">
            Allowed account type
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "parent" | "instructor")
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-foreground"
            >
              <option value="parent">Parent</option>
              <option value="instructor">Instructor</option>
            </select>
          </label>
          <Button
            type="button"
            onClick={() => void createKey()}
            disabled={isSaving}
          >
            <FiPlus />
            {isSaving ? "Creating..." : "Generate key"}
          </Button>
        </div>
        {newKey && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                New key · copy before leaving
              </p>
              <code className="mt-1 block break-all text-base font-semibold tracking-wider text-foreground">
                {newKey}
              </code>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyKey()}
            >
              <FiCopy />
              Copy key
            </Button>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-foreground">Generated keys</h2>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading keys...</p>
        ) : keys.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No allowance keys created yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {key.allowed_role === "parent" ? "Parent" : "Instructor"}{" "}
                    key{" "}
                    <span
                      className={`ml-2 text-xs ${statusOf(key) === "Available" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {statusOf(key)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {new Date(key.created_at).toLocaleString()}
                    {key.redeemed_at
                      ? ` · Used ${new Date(key.redeemed_at).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                {!key.redeemed_at && !key.revoked_at && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="self-start text-destructive sm:self-auto"
                    onClick={() => setPendingRevoke(key)}
                  >
                    <FiSlash />
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingRevoke)}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
        title="Revoke allowance key?"
        description="This key will no longer be accepted for signup."
        confirmLabel="Revoke key"
        variant="destructive"
        onConfirm={() => void revokeKey()}
      />
    </div>
  );
};
