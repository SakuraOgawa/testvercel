import type { Profile } from "../types/profile";
import type { Presenter } from "../types/presentation";

type EditablePresentation = {
  owner: string;
  presenters: Presenter[] | null;
};

export function canEditPresentation(
  presentation: EditablePresentation | null,
  userId: string | undefined,
  profile: Pick<Profile, "id" | "student_number"> | null,
): boolean {
  if (!presentation || !userId) return false;
  if (presentation.owner === userId) return true;

  // A previous user's profile can remain while the current profile loads.
  if (profile?.id !== userId) return false;
  const studentNumber = profile.student_number?.trim().toUpperCase();
  if (!studentNumber) return false;

  return Boolean(presentation.presenters?.some(
    (presenter) => presenter.student_number.trim().toUpperCase() === studentNumber,
  ));
}
