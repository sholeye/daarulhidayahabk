import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      closeButton
      duration={15000}
      className="toaster group"
      toastOptions={{
        duration: 15000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-green-600 group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-red-600 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-blue-600 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
