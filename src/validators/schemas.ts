import { z } from "zod";

const validChildName = z
  .string()
  .trim()
  .min(1, "Please add at least one child.")
  .refine(
    (value) => value.length >= 2 && !/^\d+$/.test(value),
    "Please provide a valid child name.",
  );

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const studentRegistrationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  origin: z.string().min(2, "State of origin is required"),
  sex: z.enum(["male", "female"], { required_error: "Please select sex" }),
  class: z.string().min(1, "Please select a class"),
  guardianName: z
    .string()
    .min(3, "Guardian name must be at least 3 characters"),
  guardianPhone: z
    .string()
    .min(10, "Guardian phone must be at least 10 digits"),
  guardianOccupation: z.string().min(2, "Guardian occupation is required"),
  guardianStateOfOrigin: z
    .string()
    .min(2, "Guardian state of origin is required"),
});

export const attendanceRegistrationSchema = z
  .object({
    first_name: z.string().trim().min(1, "Please enter your first name."),
    last_name: z.string().trim().min(1, "Please enter your last name."),
    parent_type: z.enum(["father", "mother"]).nullable().optional(),
    phone_number: z
      .string()
      .trim()
      .min(10, "Please enter a valid phone number."),
    number_of_children: z
      .number()
      .int()
      .min(1, "Please enter the number of children you are attending for."),
    is_parent: z.boolean(),
    representative_relationship: z.string().nullable().optional(),
    parent_absence_reason: z.string().nullable().optional(),
    children: z.array(z.string()).min(1, "Please add at least one child."),
    child_names: z
      .array(validChildName)
      .min(1, "Please add at least one child.")
      .refine(
        (values) => values.every((value) => value.trim().length > 0),
        "Please provide valid child names.",
      ),
  })
  .superRefine((value, ctx) => {
    if (value.is_parent) {
      if (
        !value.parent_type ||
        !["father", "mother"].includes(value.parent_type)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select the parent type.",
          path: ["parent_type"],
        });
      }
    }

    if (!value.is_parent) {
      if (
        !value.representative_relationship ||
        value.representative_relationship.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Please provide the relationship to the parent you are representing.",
          path: ["representative_relationship"],
        });
      }

      if (
        !value.parent_absence_reason ||
        value.parent_absence_reason.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please explain why the parent is unable to attend.",
          path: ["parent_absence_reason"],
        });
      }
    }

    if (
      value.child_names.length === 0 ||
      value.child_names.some((item) => !item || item.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please add at least one child.",
        path: ["child_names"],
      });
    }
  });

export const resultSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  score: z
    .number()
    .min(0, "Score cannot be negative")
    .max(100, "Score cannot exceed 100"),
});

export const announcementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  category: z.enum(["general", "academic", "event", "urgent"]),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentRegistrationFormData = z.infer<
  typeof studentRegistrationSchema
>;
export type ResultFormData = z.infer<typeof resultSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type AttendanceRegistrationFormData = z.infer<
  typeof attendanceRegistrationSchema
>;
