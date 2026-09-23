export type Presenter = {
  student_number: string;
};

export type Presentation = {
  id: string;
  title: string;
  seminar_name: string;
  created_at: string;
  presenters: Presenter[];
};