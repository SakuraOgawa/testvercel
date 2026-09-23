export type ProjectType =
  | "third_year"
  | "fourth_year";

export type PresentationEvent = {
  id: string;
  name: string;
  project_type: ProjectType;
  event_date: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
};