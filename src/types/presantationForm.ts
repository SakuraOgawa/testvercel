export type PresentationFormData = {
  seminarName: string;
  title: string;
  summary: string;
  documentUrl: string;
  repositoryUrl: string;
  presenters: string[];
};

export const initialPresentationForm: PresentationFormData = {
  seminarName: "",
  title: "",
  summary: "",
  documentUrl: "",
  repositoryUrl: "",
  presenters: [],
};