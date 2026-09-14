import React, { useState } from "react";
import { FiBookOpen, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { useSharedData } from "@/contexts/SharedDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const ClassesSubjectsPage: React.FC = () => {
  const {
    schoolClasses,
    classSubjects,
    addSchoolClass,
    updateSchoolClass,
    deleteSchoolClass,
    addClassSubject,
    deleteClassSubject,
  } = useSharedData();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classForm, setClassForm] = useState({
    name: "",
    nameArabic: "",
    level: "preparatory" as "preparatory" | "primary",
  });
  const [subjectForm, setSubjectForm] = useState({ name: "", nameArabic: "" });
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const selectedClass = schoolClasses.find(
    (item) => item.id === selectedClassId,
  );
  const subjects = classSubjects.filter(
    (subject) => subject.classId === selectedClassId,
  );

  const saveClass = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!classForm.name.trim()) return toast.error("Enter a class name.");
    try {
      if (editingClassId) await updateSchoolClass(editingClassId, classForm);
      else {
        await addSchoolClass(classForm);
        setSelectedClassId("");
      }
      setClassForm({ name: "", nameArabic: "", level: "preparatory" });
      setEditingClassId(null);
      toast.success(editingClassId ? "Class updated." : "Class created.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save class.",
      );
    }
  };

  const saveSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClassId) return toast.error("Select a class first.");
    if (!subjectForm.name.trim()) return toast.error("Enter a subject name.");
    try {
      await addClassSubject({
        classId: selectedClassId,
        name: subjectForm.name.trim(),
        nameArabic: subjectForm.nameArabic.trim(),
      });
      setSubjectForm({ name: "", nameArabic: "" });
      toast.success("Subject added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add subject.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Classes & Subjects
        </h1>
        <p className="text-muted-foreground mt-1">
          Create classes and configure the subjects taught in each class.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingClassId ? "Edit Class" : "Add Class"}
          </h2>
          <form onSubmit={saveClass} className="space-y-4">
            <Input
              placeholder="Class name"
              value={classForm.name}
              onChange={(event) =>
                setClassForm({ ...classForm, name: event.target.value })
              }
              required
            />
            <Input
              placeholder="Arabic name (optional)"
              value={classForm.nameArabic}
              onChange={(event) =>
                setClassForm({ ...classForm, nameArabic: event.target.value })
              }
            />
            <select
              value={classForm.level}
              onChange={(event) =>
                setClassForm({
                  ...classForm,
                  level: event.target.value as "preparatory" | "primary",
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="preparatory">Preparatory</option>
              <option value="primary">Primary</option>
            </select>
            <div className="flex gap-2">
              <Button type="submit">
                <FiPlus className="w-4 h-4 mr-2" />
                {editingClassId ? "Update Class" : "Add Class"}
              </Button>
              {editingClassId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingClassId(null);
                    setClassForm({
                      name: "",
                      nameArabic: "",
                      level: "preparatory",
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
          <div className="mt-6 border-t border-border divide-y divide-border">
            {schoolClasses.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                No classes configured.
              </p>
            )}
            {schoolClasses.map((item) => (
              <div
                key={item.id}
                className={`py-3 flex items-center gap-2 ${selectedClassId === item.id ? "bg-primary/5" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedClassId(item.id)}
                  className="flex-1 text-left px-2"
                >
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.nameArabic || item.level}
                  </p>
                </button>
                <button
                  type="button"
                  title="Edit class"
                  onClick={() => {
                    setEditingClassId(item.id);
                    setClassForm({
                      name: item.name,
                      nameArabic: item.nameArabic,
                      level: item.level,
                    });
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  title="Delete class"
                  onClick={async () => {
                    if (confirm(`Delete ${item.name}?`)) {
                      try {
                        await deleteSchoolClass(item.id);
                        if (selectedClassId === item.id) setSelectedClassId("");
                        toast.success("Class deleted.");
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to delete class.",
                        );
                      }
                    }
                  }}
                  className="p-2 text-destructive"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Subjects
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedClass
              ? `Subjects for ${selectedClass.name}`
              : "Select a class to manage its subjects."}
          </p>
          {selectedClass && (
            <>
              <form onSubmit={saveSubject} className="space-y-3 mb-5">
                <Input
                  placeholder="Subject name"
                  value={subjectForm.name}
                  onChange={(event) =>
                    setSubjectForm({ ...subjectForm, name: event.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Arabic name (optional)"
                  value={subjectForm.nameArabic}
                  onChange={(event) =>
                    setSubjectForm({
                      ...subjectForm,
                      nameArabic: event.target.value,
                    })
                  }
                />
                <Button type="submit">
                  <FiBookOpen className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </form>
              <div className="border-t border-border divide-y divide-border">
                {subjects.length === 0 && (
                  <p className="py-4 text-sm text-muted-foreground">
                    No subjects configured for this class.
                  </p>
                )}
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {subject.name}
                      </p>
                      {subject.nameArabic && (
                        <p className="text-xs text-muted-foreground">
                          {subject.nameArabic}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      title="Delete subject"
                      onClick={async () => {
                        try {
                          await deleteClassSubject(subject.id);
                          toast.success("Subject removed.");
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to remove subject.",
                          );
                        }
                      }}
                      className="p-2 text-destructive"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
