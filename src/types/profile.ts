export type UserRole =
  | "student"
  | "teacher";

export type Profile = {
  id: string;
  role: UserRole;
  student_number: string | null;
  created_at: string;
};