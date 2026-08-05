export type PresentationFormData = {
  studentNumber: string;
  studentName: string;
  seminarName: string;
  title: string;
  summary: string;
  documentUrl: string;
  repositoryUrl: string;
  presenters: string[];
  presentationNumber: string;
};

export const initialPresentationForm: PresentationFormData = {
  studentNumber: "",
  studentName: "",
  seminarName: "",
  title: "",
  summary: "",
  documentUrl: "",
  repositoryUrl: "",
  presenters: [],
  presentationNumber: "",
};