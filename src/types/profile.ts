export type UserRole =
  | "pending"
  | "student_pending"
  | "student"
  | "teacher_pending"
  | "teacher"
  | "admin";

export type Profile = {
  id: string;

  role: UserRole;

  student_number:
    string | null;

  requested_student_number:
    string | null;

  student_number_requested_at:
    string | null;

  onboarding_completed:
    boolean;

  teacher_requested_at:
    string | null;

  created_at:
    string;
};