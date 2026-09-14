/**
 * Settings Page - School info & user profile settings only
 * Assignments moved to /admin/assignments
 */

import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiSave,
  FiGlobe,
  FiLock,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";
import { useAuth } from "@/features/auth/AuthContext";
import { supabase, createIsolatedAuthClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileAvatarUploader } from "@/components/ProfileAvatarUploader";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSharedData } from "@/contexts/SharedDataContext";
import { AcademicTerm } from "@/types";

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const {
    academicTerms,
    addAcademicTerm,
    updateAcademicTerm,
    deleteAcademicTerm,
  } = useSharedData();

  const [schoolSettings, setSchoolSettings] = useState({
    name: "Daarul Hidayah",
    motto: "Learn for servitude to Allah and Sincerity of Religion",
    email: "daarulhidayahabk@gmail.com",
    phone: "08085944916",
    address: "Ita Ika, Abeokuta, Ogun State",
  });
  const emptyTerm = {
    name: "First Term",
    session: "",
    fee: "",
    startsOn: "",
    endsOn: "",
  };
  const [termForm, setTermForm] = useState(emptyTerm);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [isSavingTerm, setIsSavingTerm] = useState(false);

  const [userSettings, setUserSettings] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
  });

  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);

  const getSaveError = (error: unknown, fallback: string) => {
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message: unknown }).message);
    }
    return fallback;
  };

  useEffect(() => {
    setUserSettings((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    const loadSchoolSettings = async () => {
      const { data, error } = await supabase
        .from("school_settings")
        .select("name, motto, email, phone, address")
        .eq("id", 1)
        .maybeSingle();

      if (error || !data) return;

      setSchoolSettings({
        name: data.name,
        motto: data.motto,
        email: data.email,
        phone: data.phone,
        address: data.address,
      });
    };

    loadSchoolSettings();
  }, []);

  const handleSaveSchool = async () => {
    setIsSavingSchool(true);

    try {
      const { error } = await supabase.from("school_settings").upsert({
        id: 1,
        name: schoolSettings.name.trim(),
        motto: schoolSettings.motto.trim(),
        email: schoolSettings.email.trim().toLowerCase(),
        phone: schoolSettings.phone.trim(),
        address: schoolSettings.address.trim(),
      });

      if (error) throw error;
      toast.success("School settings updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save school settings.");
    } finally {
      setIsSavingSchool(false);
    }
  };

  const resetTermForm = () => {
    setTermForm(emptyTerm);
    setEditingTermId(null);
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number(termForm.fee);
    if (
      !termForm.name.trim() ||
      !termForm.session.trim() ||
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      toast.error("Enter a term name, session, and valid fee.");
      return;
    }
    setIsSavingTerm(true);
    try {
      const data: Partial<AcademicTerm> = {
        name: termForm.name.trim(),
        session: termForm.session.trim(),
        fee,
        startsOn: termForm.startsOn || undefined,
        endsOn: termForm.endsOn || undefined,
      };
      if (editingTermId) await updateAcademicTerm(editingTermId, data);
      else
        await addAcademicTerm({
          ...data,
          isCurrent: academicTerms.length === 0,
        });
      toast.success(
        editingTermId ? "Academic term updated." : "Academic term created.",
      );
      resetTermForm();
    } catch (e: unknown) {
      toast.error(getSaveError(e, "Failed to save academic term."));
    } finally {
      setIsSavingTerm(false);
    }
  };

  const editTerm = (term: AcademicTerm) =>
    setTermForm({
      name: term.name,
      session: term.session,
      fee: String(term.fee),
      startsOn: term.startsOn || "",
      endsOn: term.endsOn || "",
    });

  const makeCurrent = async (term: AcademicTerm) => {
    try {
      await updateAcademicTerm(term.id, { isCurrent: true });
      toast.success(`${term.name} ${term.session} is now current.`);
    } catch (e: unknown) {
      toast.error(getSaveError(e, "Failed to set current term."));
    }
  };

  const handleSaveUser = async () => {
    if (!user) return toast.error("You must be logged in.");
    const desiredName = userSettings.name.trim();
    const desiredEmail = userSettings.email.trim().toLowerCase();
    const wantsPassword = !!userSettings.newPassword.trim();
    const wantsEmail = desiredEmail !== (user.email || "").trim().toLowerCase();
    const wantsName = desiredName !== (user.name || "").trim();

    if (!wantsName && !wantsEmail && !wantsPassword)
      return toast.message("No changes to save.");
    if (wantsPassword && !userSettings.currentPassword)
      return toast.error("Enter your current password to set a new one.");

    setIsSavingUser(true);
    try {
      if (wantsName) {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: desiredName },
        });
        if (error) throw error;
      }
      if (wantsEmail) {
        const { error } = await supabase.auth.updateUser({
          email: desiredEmail,
        });
        if (error) throw error;
      }
      if (wantsPassword) {
        const isolated = createIsolatedAuthClient();
        const { error: signInErr } = await isolated.auth.signInWithPassword({
          email: user.email,
          password: userSettings.currentPassword,
        });
        await isolated.auth.signOut();
        if (signInErr) throw new Error("Current password is incorrect.");
        const { error } = await supabase.auth.updateUser({
          password: userSettings.newPassword,
        });
        if (error) throw error;
      }
      await refreshUser();
      toast.success(
        wantsEmail
          ? "Update saved — check your inbox to confirm email changes."
          : "Profile updated.",
      );
      setUserSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile.");
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          School information and account settings
        </p>
      </div>

      {/* School Information */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <FiGlobe className="w-5 h-5 text-primary" /> School Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              School Name
            </label>
            <Input
              value={schoolSettings.name}
              onChange={(e) =>
                setSchoolSettings({ ...schoolSettings, name: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Motto
            </label>
            <Input
              value={schoolSettings.motto}
              onChange={(e) =>
                setSchoolSettings({ ...schoolSettings, motto: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FiMail className="w-4 h-4 inline mr-1" /> Email
            </label>
            <Input
              type="email"
              value={schoolSettings.email}
              onChange={(e) =>
                setSchoolSettings({ ...schoolSettings, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FiPhone className="w-4 h-4 inline mr-1" /> Phone
            </label>
            <Input
              value={schoolSettings.phone}
              onChange={(e) =>
                setSchoolSettings({ ...schoolSettings, phone: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              <FiMapPin className="w-4 h-4 inline mr-1" /> Address
            </label>
            <Input
              value={schoolSettings.address}
              onChange={(e) =>
                setSchoolSettings({
                  ...schoolSettings,
                  address: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <Button onClick={handleSaveSchool} disabled={isSavingSchool}>
            <FiSave className="w-4 h-4 mr-2" />{" "}
            {isSavingSchool ? "Saving…" : "Save School Settings"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FiGlobe className="w-5 h-5 text-primary" /> Academic Terms & Fees
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create a fee for each term and session. The current term is used
              for new students and payments.
            </p>
          </div>
          {editingTermId && (
            <Button type="button" variant="outline" onClick={resetTermForm}>
              Cancel edit
            </Button>
          )}
        </div>
        <form
          onSubmit={handleSaveTerm}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Term *
            </label>
            <Input
              value={termForm.name}
              onChange={(e) =>
                setTermForm({ ...termForm, name: e.target.value })
              }
              placeholder="First Term"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Session *
            </label>
            <Input
              value={termForm.session}
              onChange={(e) =>
                setTermForm({ ...termForm, session: e.target.value })
              }
              placeholder="2025/2026"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fee (₦) *
            </label>
            <Input
              type="number"
              min="0"
              value={termForm.fee}
              onChange={(e) =>
                setTermForm({ ...termForm, fee: e.target.value })
              }
              placeholder="6000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Starts
            </label>
            <Input
              type="date"
              value={termForm.startsOn}
              onChange={(e) =>
                setTermForm({ ...termForm, startsOn: e.target.value })
              }
            />
          </div>
          <Button type="submit" disabled={isSavingTerm}>
            <FiPlus className="w-4 h-4 mr-2" />
            {isSavingTerm
              ? "Saving..."
              : editingTermId
                ? "Update Term"
                : "Create Term"}
          </Button>
        </form>
        <div className="mt-6 border-t border-border divide-y divide-border">
          {academicTerms.length === 0 && (
            <p className="py-5 text-sm text-muted-foreground">
              No academic terms configured yet.
            </p>
          )}
          {academicTerms.map((term) => (
            <div
              key={term.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {term.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {term.session}
                  </span>
                  {term.isCurrent && (
                    <span className="ml-2 text-xs text-primary">
                      <FiCheck className="inline w-3 h-3" /> Current
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {term.fee.toLocaleString()} NGN
                  {term.startsOn ? ` · starts ${term.startsOn}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    editTerm(term);
                    setEditingTermId(term.id);
                  }}
                >
                  <FiEdit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {!term.isCurrent && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => makeCurrent(term)}
                  >
                    Set current
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (confirm(`Delete ${term.name} ${term.session}?`)) {
                      try {
                        await deleteAcademicTerm(term.id);
                        toast.success("Academic term deleted.");
                      } catch (e: unknown) {
                        toast.error(getSaveError(e, "Failed to delete term."));
                      }
                    }
                  }}
                >
                  <FiTrash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <FiUser className="w-5 h-5 text-primary" /> Profile Settings
        </h2>
        <div className="mb-6">
          <ProfileAvatarUploader sizeClass="w-16 h-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <Input
              value={userSettings.name}
              onChange={(e) =>
                setUserSettings({ ...userSettings, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <Input
              type="email"
              value={userSettings.email}
              onChange={(e) =>
                setUserSettings({ ...userSettings, email: e.target.value })
              }
            />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FiLock className="w-4 h-4" /> Change Password
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Password
              </label>
              <Input
                type="password"
                value={userSettings.currentPassword}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={userSettings.newPassword}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <Button onClick={handleSaveUser} disabled={isSavingUser}>
            <FiSave className="w-4 h-4 mr-2" />{" "}
            {isSavingUser ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
