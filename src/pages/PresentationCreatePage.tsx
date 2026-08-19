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
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Close,
} from "@mui/icons-material";

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

export default function PresentationCreatePage({
  session,
}: PresentationCreatePageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    location.state as LocationState | null;

  /*
   * 確認画面から「修正する」で戻ってきた場合は、
   * stateに保存されている入力内容を復元する
   */
  const [form, setForm] =
    useState<PresentationFormData>(
      locationState?.form ??
        initialPresentationForm,
    );

  /*
   * 発表者追加用の入力欄
   */
  const [presenterName, setPresenterName] =
    useState("");

  /*
   * 発表者入力欄だけのエラー
   */
  const [
    presenterInputError,
    setPresenterInputError,
  ] = useState("");

  /*
   * フォーム全体のエラー
   */
  const [errors, setErrors] =
    useState<FormErrors>({});

  /*
   * 通常のフォーム入力を変更する処理
   */
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

    /*
     * 入力された項目のエラーだけ消す
     */
    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: undefined,
    }));
  };

  /*
   * 発表者を追加
   */
  const handleAddPresenter = () => {
    const trimmedName =
      presenterName.trim();

    /*
     * 空欄の場合
     */
    if (!trimmedName) {
      setPresenterInputError(
        "発表者名を入力してください。",
      );
      return;
    }

    /*
     * 同じ名前を二重登録しない
     */
    if (
      form.presenters.includes(trimmedName)
    ) {
      setPresenterInputError(
        "同じ発表者がすでに追加されています。",
      );
      return;
    }

    setForm((previousForm) => ({
      ...previousForm,
      presenters: [
        ...previousForm.presenters,
        trimmedName,
      ],
    }));

    /*
     * 追加後は入力欄を空にする
     */
    setPresenterName("");

    setPresenterInputError("");

    /*
     * 「発表者を追加してください」の
     * バリデーションエラーも消す
     */
    setErrors((previousErrors) => ({
      ...previousErrors,
      presenters: undefined,
    }));
  };

  /*
   * 発表者を削除
   */
  const handleRemovePresenter = (
    index: number,
  ) => {
    setForm((previousForm) => ({
      ...previousForm,

      presenters:
        previousForm.presenters.filter(
          (_, presenterIndex) =>
            presenterIndex !== index,
        ),
    }));
  };

  /*
   * フォーム全体のバリデーション
   */
  const validateForm =
    (): FormErrors => {
      const newErrors: FormErrors = {};

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

      if (
        form.presenters.length === 0
      ) {
        newErrors.presenters =
          "発表者を1人以上追加してください。";
      }

      return newErrors;
    };

  /*
   * 「入力内容を確認」
   */
  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationErrors =
      validateForm();

    if (
      Object.keys(
        validationErrors,
      ).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    /*
     * 確認画面へ入力データを渡す
     */
    navigate(
      "/presentations/confirm",
      {
        state: {
          form,
        },
      },
    );
  };

  /*
   * キャンセル
   */
  const handleCancel = () => {
    navigate("/");
  };

  /*
   * ログアウト
   */
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
          {/* ============================= */}
          {/* タイトル */}
          {/* ============================= */}

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

          {/* ============================= */}
          {/* 2カラムフォーム */}
          {/* ============================= */}

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
            {/* ============================= */}
            {/* 左側 */}
            {/* ============================= */}

            <Box>
              {/* ゼミ名 */}

              <FormFieldLabel>
                ゼミ名（教員名）
              </FormFieldLabel>

              <StyledTextField
                value={form.seminarName}
                placeholder="例）貞廣ゼミ"
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

              {/* タイトル */}

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

              {/* 発表概要 */}

              <FormFieldLabel>
                発表概要
              </FormFieldLabel>

              <TextField
                fullWidth
                multiline
                minRows={8}
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

            {/* ============================= */}
            {/* 右側 */}
            {/* ============================= */}

            <Box>
              {/* 資料URL */}

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

              {/* GitHub URL */}

              <FormFieldLabel>
                Gitリポジトリへのリンク
              </FormFieldLabel>

              <StyledTextField
                value={
                  form.repositoryUrl
                }
                placeholder="例）https://github.com/example/repo"
                onChange={(event) => {
                  handleChange(
                    "repositoryUrl",
                    event.target.value,
                  );
                }}
              />

              {/* ============================= */}
              {/* 発表者 */}
              {/* ============================= */}

              <FormFieldLabel>
                発表者
              </FormFieldLabel>

              <Typography
                sx={{
                  mb: 1,
                  color: "#777777",
                  fontSize: 12,
                }}
              >
                発表者名を入力して＋ボタンで追加してください
              </Typography>

              {/* 発表者入力欄 */}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  value={presenterName}
                  placeholder="例）山田 太郎"
                  error={Boolean(
                    presenterInputError,
                  )}
                  helperText={
                    presenterInputError
                  }
                  onChange={(event) => {
                    setPresenterName(
                      event.target.value,
                    );

                    if (
                      presenterInputError
                    ) {
                      setPresenterInputError(
                        "",
                      );
                    }
                  }}
                
                  sx={fieldStyle}
                />

                <Button
                  type="button"
                  variant="contained"
                  aria-label="発表者を追加"
                  onClick={
                    handleAddPresenter
                  }
                  sx={{
                    minWidth: 44,
                    width: 44,
                    height: 40,
                    p: 0,

                    bgcolor: "#172e5a",

                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.12)",

                    "&:hover": {
                      bgcolor: "#102447",
                    },
                  }}
                >
                  <Add />
                </Button>
              </Box>

              {/* ============================= */}
              {/* 追加済み発表者 */}
              {/* ============================= */}

              {form.presenters.length >
                0 && (
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: 1,
                  }}
                >
                  {form.presenters.map(
                    (
                      presenter,
                      index,
                    ) => (
                      <Box
                        key={`${presenter}-${index}`}
                        sx={{
                          minHeight: 42,

                          px: 1.5,

                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",

                          border:
                            "1px solid #d5d5d5",

                          borderRadius: 1,

                          bgcolor:
                            "#ffffff",

                          boxShadow:
                            "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 13,
                            color:
                              "#333333",
                          }}
                        >
                          {presenter}
                        </Typography>

                        <Button
                          type="button"
                          aria-label={`${presenter}を削除`}
                          onClick={() => {
                            handleRemovePresenter(
                              index,
                            );
                          }}
                          sx={{
                            minWidth: 32,
                            width: 32,
                            height: 32,
                            p: 0,
                            color:
                              "#888888",

                            "&:hover": {
                              color:
                                "#d32f2f",
                              bgcolor:
                                "rgba(211,47,47,0.05)",
                            },
                          }}
                        >
                          <Close
                            sx={{
                              fontSize: 19,
                            }}
                          />
                        </Button>
                      </Box>
                    ),
                  )}
                </Box>
              )}

              {/* 発表者0人の場合のエラー */}

              {errors.presenters && (
                <Typography
                  role="alert"
                  sx={{
                    mt: 0.7,
                    color: "error.main",
                    fontSize: 12,
                  }}
                >
                  {errors.presenters}
                </Typography>
              )}

              {/* ============================= */}
              {/* ボタン */}
              {/* ============================= */}

              <Box
                sx={{
                  mt: {
                    xs: 4,
                    lg: 8,
                  },

                  display: "flex",

                  flexDirection: {
                    xs: "column-reverse",
                    sm: "row",
                  },

                  justifyContent:
                    "flex-end",

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
                    borderColor:
                      "#bdbdbd",

                    fontSize: 13,
                    fontWeight: 700,
                    textTransform:
                      "none",

                    boxShadow:
                      "0 2px 4px rgba(0,0,0,0.1)",

                    "&:hover": {
                      borderColor:
                        "#999999",

                      bgcolor:
                        "#fafafa",
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
                    textTransform:
                      "none",

                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.15)",

                    "&:hover": {
                      bgcolor:
                        "#102447",
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

/*
 * =========================================
 * ラベル
 * =========================================
 */

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

/*
 * =========================================
 * 共通TextField
 * =========================================
 */

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

/*
 * =========================================
 * 入力欄共通スタイル
 * =========================================
 */

const fieldStyle = {
  mb: 0.7,

  bgcolor: "#ffffff",

  "& .MuiOutlinedInput-root": {
    borderRadius: 1,

    fontSize: 13,

    boxShadow:
      "0 2px 5px rgba(0,0,0,0.12)",
  },

  "& .MuiOutlinedInput-notchedOutline":
    {
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