import React from "react";
import { FiBookOpen, FiDownload, FiFileText } from "react-icons/fi";
import { useSharedData } from "@/contexts/SharedDataContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getBookUrl } from "@/services/supabaseService";

const formatFileSize = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const LearnerBooks: React.FC = () => {
  const { user } = useAuth();
  const { books, students, isLoading } = useSharedData();
  const student =
    students.length === 1
      ? students[0]
      : students.find((item) => item.email === user?.email);
  const classBooks = student
    ? books.filter((book) => book.className === student.class)
    : [];

  const openBook = async (filePath: string) => {
    try {
      const url = await getBookUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open book.",
      );
    }
  };

  const downloadBook = async (filePath: string, fileName: string) => {
    try {
      const url = await getBookUrl(filePath);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Unable to download book.");
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to download book.",
      );
    }
  };
  if (isLoading)
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading books...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Book List
        </h1>
        <p className="text-muted-foreground mt-1">
          Books and guides shared by your instructor.
        </p>
        {student && (
          <p className="text-sm text-primary mt-2">Class: {student.class}</p>
        )}
      </div>
      {!student ? (
        <div className="bg-card rounded-2xl border border-border p-6 text-sm text-muted-foreground">
          Your student profile is not available yet.
        </div>
      ) : classBooks.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-6 text-sm text-muted-foreground">
          No books have been shared with your class yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {classBooks.map((book) => (
            <article
              key={book.id}
              className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <FiFileText className="w-5 h-5 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground break-words">
                    {book.title}
                  </h2>
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
                  onClick={() => openBook(book.filePath)}
                >
                  <FiBookOpen />
                  View PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openBook(book.filePath)}
                >
                  <FiBookOpen />
                  View PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => downloadBook(book.filePath, book.fileName)}
                >
                  <FiDownload />
                  Download PDF
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
