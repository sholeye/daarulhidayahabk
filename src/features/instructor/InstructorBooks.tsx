import React, { useMemo, useState } from "react";
import {
  FiBookOpen,
  FiDownload,
  FiFileText,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { useAuth } from "@/features/auth/AuthContext";
import { useSharedData } from "@/contexts/SharedDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getBookUrl, uploadBookFile } from "@/services/supabaseService";
import type { Book } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatFileSize = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const InstructorBooks: React.FC = () => {
  const { user } = useAuth();
  const { books, schoolClasses, addBook, deleteBook } = useSharedData();
  const assignedClasses = useMemo(
    () =>
      schoolClasses.filter(
        (schoolClass) => schoolClass.instructorId === user?.id,
      ),
    [schoolClasses, user?.id],
  );
  const assignedClassIds = new Set(
    assignedClasses.map((schoolClass) => schoolClass.id),
  );
  const instructorBooks = books.filter((book) =>
    assignedClassIds.has(book.classId),
  );
  const [selectedClassId, setSelectedClassId] = useState(
    assignedClasses[0]?.id || "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedClass = assignedClasses.find(
      (schoolClass) => schoolClass.id === selectedClassId,
    );
    if (!user || !selectedClass || !file) {
      toast.error("Select an assigned class and PDF file.");
      return;
    }
    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Only PDF files can be uploaded.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("PDF files must be 10 MB or smaller.");
      return;
    }

    setIsSaving(true);
    try {
      const filePath = await uploadBookFile(file, user.id);
      await addBook({
        instructorId: user.id,
        classId: selectedClass.id,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        filePath,
        fileName: file.name,
        fileSize: file.size,
      });
      setTitle("");
      setDescription("");
      setInstructions("");
      setFile(null);
      const fileInput = document.getElementById(
        "book-file",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      toast.success("Book uploaded for the selected class.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload book.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openBook = async (book: Book) => {
    try {
      const url = await getBookUrl(book.filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open book.",
      );
    }
  };

  const removeBook = async (book: Book) => {
    if (!window.confirm(`Remove “${book.title}” for ${book.className}?`))
      return;
    try {
      await deleteBook(book);
      toast.success("Book removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove book.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Book List
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload PDF guides and books for your assigned classes.
        </p>
      </div>

      <section className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FiUpload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Upload a PDF</h2>
            <p className="text-sm text-muted-foreground">
              Learners in the selected class will be able to view and download
              it.
            </p>
          </div>
        </div>
        {assignedClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No class has been assigned to you yet.
          </p>
        ) : (
          <form
            onSubmit={handleUpload}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="book-class"
                className="text-sm font-medium text-foreground"
              >
                Class
              </label>
              <select
                id="book-class"
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground"
                required
              >
                {assignedClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="book-title"
                className="text-sm font-medium text-foreground"
              >
                Book name
              </label>
              <Input
                id="book-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Arabic Grammar Guide"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="book-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="book-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this book covers"
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="book-instructions"
                className="text-sm font-medium text-foreground"
              >
                Printing or study instructions
              </label>
              <textarea
                id="book-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Optional instructions for reading or printing"
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="book-file"
                className="text-sm font-medium text-foreground"
              >
                PDF file
              </label>
              <Input
                id="book-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                PDF only, maximum 10 MB.
              </p>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Uploading..." : "Upload book"}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">
          Uploaded books
        </h2>
        {instructorBooks.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-sm text-muted-foreground">
            No books uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {instructorBooks.map((book) => (
              <article
                key={book.id}
                className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <FiFileText className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground break-words">
                      {book.title}
                    </h3>
                    <p className="text-sm text-primary">{book.className}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {book.fileName} · {formatFileSize(book.fileSize)}
                    </p>
                  </div>
                </div>
                {book.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {book.description}
                  </p>
                )}
                {book.instructions && (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    <span className="font-medium">Instructions:</span>{" "}
                    {book.instructions}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openBook(book)}
                  >
                    <FiBookOpen />
                    View PDF
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeBook(book)}
                  >
                    <FiTrash2 />
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
