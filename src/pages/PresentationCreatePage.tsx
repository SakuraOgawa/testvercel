import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
  HTMLInputTypeAttribute,
  ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import { supabase } from "../lib/supabase";

import {
  initialPresentationForm,
  type PresentationFormData,
} from "../types/presantationForm";

type PresentationCreatePageProps = {
  session: Session;
};

type LocationState = {
  form?: PresentationFormData;
};

type FormErrors = Partial<
  Record<keyof PresentationFormData, string>
>;

const presenterOptions = [
  "山田太郎",
  "佐藤花子",
  "鈴木一郎",
  "高橋美咲",
  "伊藤健太",
];

export default function PresentationCreatePage({
  session,
}: PresentationCreatePageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    location.state as LocationState | null;

  const [form, setForm] =
    useState<PresentationFormData>(
      locationState?.form ??
        initialPresentationForm,
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const handleChange = <
    Key extends keyof PresentationFormData,
  >(
    field: Key,
    value: PresentationFormData[Key],
  ) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: undefined,
    }));
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.studentNumber.trim()) {
      newErrors.studentNumber =
        "学籍番号を入力してください。";
    }

    if (!form.studentName.trim()) {
      newErrors.studentName =
        "氏名を入力してください。";
    }

    if (!form.seminarName.trim()) {
      newErrors.seminarName =
        "ゼミ名または教員名を入力してください。";
    }

    if (!form.title.trim()) {
      newErrors.title =
        "タイトルを入力してください。";
    }

    if (!form.summary.trim()) {
      newErrors.summary =
        "発表概要を入力してください。";
    }

    if (form.presenters.length === 0) {
      newErrors.presenters =
        "発表者を1人以上選択してください。";
    }

    if (!form.presentationNumber.trim()) {
      newErrors.presentationNumber =
        "発表番号を入力してください。";
    }

    return newErrors;
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationErrors =
      validateForm();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    navigate("/presentations/confirm", {
      state: {
        form,
      },
    });
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "ログアウトエラー:",
        error,
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
      }}
    >
      <Sidebar
        session={session}
        onLogout={() => {
          void handleLogout();
        }}
      />

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          ml: {
            xs: 0,
            md: `${drawerWidth}px`,
          },
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            minHeight: "100vh",
            px: {
              xs: 2,
              sm: 3,
              md: 4.5,
            },
            pt: 4,
            pb: 5,
          }}
        >
          <Typography
            component="h1"
            sx={{
              mb: 3,
              fontSize: 22,
              fontWeight: 700,
              color: "#333333",
            }}
          >
            発表登録
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "1fr 1fr",
              },
              columnGap: {
                xs: 0,
                lg: 5.5,
              },
              rowGap: 2,
            }}
          >
            <Box>
              <FormFieldLabel>
                学籍番号
              </FormFieldLabel>

              <StyledTextField
                value={form.studentNumber}
                placeholder="例）G23934"
                error={Boolean(
                  errors.studentNumber,
                )}
                helperText={
                  errors.studentNumber
                }
                onChange={(event) => {
                  handleChange(
                    "studentNumber",
                    event.target.value,
                  );
                }}
              />

              <FormFieldLabel>
                氏名
              </FormFieldLabel>

              <StyledTextField
                value={form.studentName}
                placeholder="例）山田 太郎"
                error={Boolean(
                  errors.studentName,
                )}
                helperText={
                  errors.studentName
                }
                onChange={(event) => {
                  handleChange(
                    "studentName",
                    event.target.value,
                  );
                }}
              />

              <FormFieldLabel>
                ゼミ名（教員名）
              </FormFieldLabel>

              <StyledTextField
                value={form.seminarName}
                placeholder="例）貞廣 泰造"
                error={Boolean(
                  errors.seminarName,
                )}
                helperText={
                  errors.seminarName
                }
                onChange={(event) => {
                  handleChange(
                    "seminarName",
                    event.target.value,
                  );
                }}
              />

              <FormFieldLabel>
                タイトル
              </FormFieldLabel>

              <StyledTextField
                value={form.title}
                placeholder="例）AIを用いた〇〇の研究"
                error={Boolean(
                  errors.title,
                )}
                helperText={errors.title}
                onChange={(event) => {
                  handleChange(
                    "title",
                    event.target.value,
                  );
                }}
              />

              <FormFieldLabel>
                発表概要
              </FormFieldLabel>

              <TextField
                fullWidth
                multiline
                minRows={6}
                value={form.summary}
                placeholder="発表の概要を入力してください"
                error={Boolean(
                  errors.summary,
                )}
                helperText={errors.summary}
                onChange={(event) => {
                  handleChange(
                    "summary",
                    event.target.value,
                  );
                }}
                sx={fieldStyle}
              />
            </Box>

            <Box>
              <FormFieldLabel>
                資料等へのリンク
              </FormFieldLabel>

              <StyledTextField
                value={form.documentUrl}
                placeholder="例）https://example.com/slides.pdf"
                onChange={(event) => {
                  handleChange(
                    "documentUrl",
                    event.target.value,
                  );
                }}
              />

              <FormFieldLabel>
                Gitリポジトリへのリンク
              </FormFieldLabel>

              <StyledTextField
                value={form.repositoryUrl}
                placeholder="例）https://github.com/example/repo"
                onChange={(event) => {
                  handleChange(
                    "repositoryUrl",
                    event.target.value,
                  );
                }}
              />

              <FormFieldLabel>
                発表者（複数選択可）
              </FormFieldLabel>

              <FormControl
                fullWidth
                size="small"
                error={Boolean(
                  errors.presenters,
                )}
                sx={{
                  mb: 0.7,
                }}
              >
                <Select<string[]>
                  multiple
                  displayEmpty
                  value={form.presenters}
                  input={<OutlinedInput />}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    handleChange(
                      "presenters",
                      typeof value === "string"
                        ? value.split(",")
                        : value,
                    );
                  }}
                  renderValue={(selected) => {
                    if (
                      selected.length === 0
                    ) {
                      return (
                        <Typography
                          component="span"
                          sx={{
                            color: "#555555",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          発表者を選択してください
                        </Typography>
                      );
                    }

                    return selected.join("、");
                  }}
                  sx={{
                    minHeight: 40,
                    borderRadius: 1,
                    fontSize: 13,
                    bgcolor: "#ffffff",
                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.12)",

                    "& .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor:
                          "#d5d5d5",
                      },

                    "&:hover .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor:
                          "#b8b8b8",
                      },
                  }}
                >
                  {presenterOptions.map(
                    (presenter) => (
                      <MenuItem
                        key={presenter}
                        value={presenter}
                      >
                        {presenter}
                      </MenuItem>
                    ),
                  )}
                </Select>

                {errors.presenters && (
                  <FormHelperText>
                    {errors.presenters}
                  </FormHelperText>
                )}
              </FormControl>

              <FormFieldLabel>
                発表番号
              </FormFieldLabel>

              <StyledTextField
                type="number"
                value={
                  form.presentationNumber
                }
                placeholder="例）1"
                error={Boolean(
                  errors.presentationNumber,
                )}
                helperText={
                  errors.presentationNumber
                }
                onChange={(event) => {
                  handleChange(
                    "presentationNumber",
                    event.target.value,
                  );
                }}
              />

              <Box
                sx={{
                  mt: {
                    xs: 4,
                    lg: 9,
                  },
                  display: "flex",
                  flexDirection: {
                    xs: "column-reverse",
                    sm: "row",
                  },
                  justifyContent: "flex-end",
                  gap: 1.5,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 130,
                    },
                    height: 44,
                    color: "#333333",
                    borderColor: "#bdbdbd",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow:
                      "0 2px 4px rgba(0,0,0,0.1)",

                    "&:hover": {
                      borderColor: "#999999",
                      bgcolor: "#fafafa",
                    },
                  }}
                >
                  キャンセル
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 160,
                    },
                    height: 44,
                    bgcolor: "#172e5a",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.15)",

                    "&:hover": {
                      bgcolor: "#102447",
                    },
                  }}
                >
                  入力内容を確認
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

type FormFieldLabelProps = {
  children: ReactNode;
};

function FormFieldLabel({
  children,
}: FormFieldLabelProps) {
  return (
    <Typography
      component="label"
      sx={{
        display: "block",
        mt: 0.8,
        mb: 0.7,
        color: "#333333",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
  );
}

type StyledTextFieldProps = {
  value: string;
  placeholder: string;
  type?: HTMLInputTypeAttribute;
  error?: boolean;
  helperText?: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function StyledTextField({
  value,
  placeholder,
  type = "text",
  error = false,
  helperText,
  onChange,
}: StyledTextFieldProps) {
  return (
    <TextField
      fullWidth
      size="small"
      type={type}
      value={value}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      onChange={onChange}
      sx={fieldStyle}
    />
  );
}

const fieldStyle = {
  mb: 0.7,
  bgcolor: "#ffffff",

  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    fontSize: 13,
    boxShadow:
      "0 2px 5px rgba(0,0,0,0.12)",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#d5d5d5",
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
    {
      borderColor: "#b8b8b8",
    },

  "& .MuiFormHelperText-root": {
    mx: 0,
    mt: 0.5,
    fontSize: 12,
  },
};