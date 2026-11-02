import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Add, ArrowBack, Close } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import Sidebar, { drawerWidth } from "../components/Sidebar";
import { useAuthContext } from "../hooks/useAuthContext";
import { supabase } from "../lib/supabase";
import { canEditPresentation as checkPresentationEditPermission } from "../lib/presentationPermissions";
import type { PresentationFormData } from "../types/presentationForm";
import "../styles/markdown.css";

type Presenter = {
  student_number: string;
};

type PresentationEditRow = {
  id: string;
  event_id: string;
  owner: string;
  seminar_name: string;
  title: string;
  summary: string | null;
  material_url: string | null;
  github_url: string | null;
  presenters: Presenter[] | null;
};

type FormErrors = Partial<
  Record<keyof PresentationFormData, string>
>;

export default function PresentationEditPage() {
  const navigate = useNavigate();

  const { eventId, presentationId } = useParams<{
    eventId: string;
    presentationId: string;
  }>();

  const { session, profile } = useAuthContext();

  const [owner, setOwner] = useState("");
  const [allPresenters, setAllPresenters] = useState<string[]>([]);
  const [seminarOptions, setSeminarOptions] = useState<string[]>([]);

  const [form, setForm] = useState<PresentationFormData>({
    seminarName: "",
    title: "",
    summary: "",
    documentUrl: "",
    repositoryUrl: "",
    presenters: [],
  });

  const [studentNumber, setStudentNumber] = useState("");
  const [presenterInputError, setPresenterInputError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const ownStudentNumber = profile?.id === session?.user.id
    ? profile?.student_number?.trim().toUpperCase() ?? ""
    : "";

  const canEditPresentation = checkPresentationEditPermission(
    { owner, presenters: allPresenters.map((student_number) => ({ student_number })) },
    session?.user.id,
    profile,
  );

  useEffect(() => {
    if (!eventId || !presentationId) {
      return;
    }

    let isCancelled = false;

    const fetchPresentation = async () => {
      const { data, error } = await supabase
        .from("presentations")
        .select(`
          id,
          event_id,
          owner,
          seminar_name,
          title,
          summary,
          material_url,
          github_url,
          presenters (
            student_number
          )
        `)
        .eq("id", presentationId)
        .eq("event_id", eventId)
        .maybeSingle();

      if (isCancelled) {
        return;
      }

      if (error) {
        console.error("発表編集情報取得エラー:", error);
        setLoadError("発表情報を取得できませんでした。");
        setIsLoading(false);
        return;
      }

      if (!data) {
        setLoadError(
          "指定された発表が見つかりませんでした。",
        );
        setIsLoading(false);
        return;
      }

      const row = data as PresentationEditRow;

      const presenterNumbers = (row.presenters ?? [])
        .map((presenter) =>
          presenter.student_number.trim().toUpperCase(),
        )
        .filter(Boolean);

      setOwner(row.owner);
      setAllPresenters(presenterNumbers);
      const { data: seminarRows } = await supabase.from("presentations").select("seminar_name").eq("event_id", eventId).not("seminar_name", "is", null);
      const names = [...new Set([row.seminar_name, ...(seminarRows ?? []).map((item) => item.seminar_name)].map((name) => name?.trim()).filter((name): name is string => Boolean(name)))].sort((a, b) => a.localeCompare(b, "ja"));
      setSeminarOptions(names);

      const coPresenters = ownStudentNumber
        ? presenterNumbers.filter(
            (presenter) => presenter !== ownStudentNumber,
          )
        : presenterNumbers;

      setForm({
        seminarName: row.seminar_name,
        title: row.title,
        summary: row.summary ?? "",
        documentUrl: row.material_url ?? "",
        repositoryUrl: row.github_url ?? "",
        presenters: coPresenters,
      });

      setLoadError("");
      setIsLoading(false);
    };

    void fetchPresentation();

    return () => {
      isCancelled = true;
    };
  }, [eventId, presentationId, ownStudentNumber]);

  const handleChange = (
    field:
      | "seminarName"
      | "title"
      | "summary"
      | "documentUrl"
      | "repositoryUrl",
    value: string,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleAddPresenter = () => {
    const normalizedStudentNumber = studentNumber
      .trim()
      .toUpperCase();

    setPresenterInputError("");

    if (!normalizedStudentNumber) {
      setPresenterInputError(
        "学籍番号を入力してください。",
      );
      return;
    }

    if (
      ownStudentNumber &&
      normalizedStudentNumber === ownStudentNumber
    ) {
      setPresenterInputError(
        "あなたの学籍番号は自動で発表者に登録されます。",
      );
      return;
    }

    const alreadyExists = form.presenters.some(
      (presenter) =>
        presenter.trim().toUpperCase() ===
        normalizedStudentNumber,
    );

    if (alreadyExists) {
      setPresenterInputError(
        "同じ学籍番号がすでに追加されています。",
      );
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      presenters: [
        ...currentForm.presenters,
        normalizedStudentNumber,
      ],
    }));

    setStudentNumber("");

    setErrors((currentErrors) => ({
      ...currentErrors,
      presenters: undefined,
    }));
  };

  const handleRemovePresenter = (
    studentNumberToRemove: string,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      presenters: currentForm.presenters.filter(
        (presenter) =>
          presenter !== studentNumberToRemove,
      ),
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!form.seminarName.trim()) {
      newErrors.seminarName = "ゼミ名（教員名）を入力してください。";
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
      !ownStudentNumber &&
      form.presenters.length === 0
    ) {
      newErrors.presenters =
        "発表者の学籍番号を1件以上追加してください。";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !canEditPresentation ||
      !eventId ||
      !presentationId
    ) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    const presenterStudentNumbers = [
      ...new Set([
        ...(ownStudentNumber
          ? [ownStudentNumber]
          : []),
        ...form.presenters.map((presenter) =>
          presenter.trim().toUpperCase(),
        ),
      ]),
    ].filter(Boolean);

    const { error } = await supabase.rpc(
      "update_presentation",
      {
        p_presentation_id: presentationId,
        p_seminar_name: form.seminarName.trim(),
        p_title: form.title.trim(),
        p_summary: form.summary,
        p_material_url:
          form.documentUrl.trim() || null,
        p_github_url:
          form.repositoryUrl.trim() || null,
        p_presenter_student_numbers:
          presenterStudentNumbers,
      },
    );

    if (error) {
      console.error("発表更新エラー:", error);

      setSaveError(
        error.message ||
          "発表情報を更新できませんでした。",
      );

      setIsSaving(false);
      return;
    }

    navigate(
      `/events/${eventId}/presentations/${presentationId}`,
      {
        replace: true,
      },
    );
  };

  const handleCancel = () => {
    if (!eventId || !presentationId) {
      navigate("/events");
      return;
    }

    navigate(
      `/events/${eventId}/presentations/${presentationId}`,
    );
  };

  if (!eventId || !presentationId) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f7f8fa",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography color="error" sx={{ mb: 2 }}>
            発表を特定できませんでした。
          </Typography>

          <Button
            variant="contained"
            onClick={() => {
              navigate("/events");
            }}
            sx={{
              bgcolor: "#172e5a",
              "&:hover": {
                bgcolor: "#102447",
              },
            }}
          >
            発表会一覧へ戻る
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f8fa",
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md: `${drawerWidth}px`,
          },
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            px: {
              xs: 2,
              sm: 3,
              md: 4,
            },
            py: 4,
          }}
        >
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={handleCancel}
            sx={{
              mb: 2,
              color: "#172e5a",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            発表詳細へ戻る
          </Button>

          {isLoading && (
            <Box
              sx={{
                py: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {!isLoading && loadError && (
            <Alert
              severity="error"
              sx={{ maxWidth: 1100 }}
            >
              {loadError}
            </Alert>
          )}

          {!isLoading &&
            !loadError &&
            !canEditPresentation && (
              <Alert
                severity="error"
                sx={{ maxWidth: 1100 }}
              >
                この発表を編集する権限がありません。
              </Alert>
            )}

          {!isLoading &&
            !loadError &&
            canEditPresentation && (
              <Box sx={{ maxWidth: 1100 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    component="h1"
                    sx={{
                      fontSize: {
                        xs: 24,
                        md: 28,
                      },
                      fontWeight: 700,
                      color: "#222222",
                    }}
                  >
                    発表を編集
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      color: "text.secondary",
                      fontSize: 13,
                    }}
                  >
                    登録されている発表情報を編集します。
                  </Typography>
                </Box>

                <Paper
                  component="form"
                  onSubmit={handleSubmit}
                  elevation={0}
                  sx={{
                    p: {
                      xs: 2,
                      sm: 3,
                    },
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                  }}
                >
                  <FormFieldLabel>
                    ゼミ名（教員名）
                  </FormFieldLabel>

                  <TextField
                    fullWidth
                    select
                    size="small"
                    value={form.seminarName}
                    error={Boolean(errors.seminarName)}
                    helperText={errors.seminarName || "ゼミを選択してください。"}
                    onChange={(event) => handleChange("seminarName", event.target.value)}
                    sx={fieldStyle}
                  >
                    <MenuItem value="">ゼミ未設定</MenuItem>
                    {seminarOptions.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                  </TextField>

                  <FormFieldLabel>
                    タイトル
                  </FormFieldLabel>

                  <TextField
                    fullWidth
                    size="small"
                    value={form.title}
                    placeholder="発表タイトルを入力してください"
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    onChange={(event) => {
                      handleChange(
                        "title",
                        event.target.value,
                      );
                    }}
                    sx={fieldStyle}
                  />

                  <FormFieldLabel>
                    発表概要
                  </FormFieldLabel>

                  <Typography
                    sx={{
                      mb: 1.2,
                      color: "text.secondary",
                      fontSize: 12,
                    }}
                  >
                    Markdown形式で入力できます。右側にリアルタイムでプレビューされます。
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        lg: "minmax(0, 1fr) minmax(0, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          mb: 0.8,
                          color: "#555555",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Markdown
                      </Typography>

                      <TextField
                        fullWidth
                        multiline
                        minRows={16}
                        value={form.summary}
                        placeholder={`## 研究概要

この研究では、**〇〇**について検討します。<br>
ここで改行できます。

### 目的

- 目的1
- 目的2
- 目的3

### 使用技術

| 技術 | 用途 |
| --- | --- |
| React | フロントエンド |
| Supabase | データベース |

> 発表情報を効率的に管理することを目的とする。

[GitHub](https://github.com/)`}
                        error={Boolean(errors.summary)}
                        helperText={errors.summary}
                        onChange={(event) => {
                          handleChange(
                            "summary",
                            event.target.value,
                          );
                        }}
                        sx={{
                          ...fieldStyle,
                          "& .MuiInputBase-root": {
                            alignItems: "flex-start",
                          },
                          "& textarea": {
                            fontFamily:
                              '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                            fontSize: 13,
                            lineHeight: 1.7,
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          mb: 0.8,
                          color: "#555555",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        プレビュー
                      </Typography>

                      <Box
                        sx={{
                          minHeight: 408,
                          maxHeight: 520,
                          px: 2,
                          py: 1.5,
                          overflow: "auto",
                          bgcolor: "#ffffff",
                          border: "1px solid #d5d5d5",
                          borderRadius: 1,
                        }}
                      >
                        {form.summary.trim() ? (
                          <Box className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[
                                rehypeRaw,
                                rehypeSanitize,
                              ]}
                            >
                              {form.summary}
                            </ReactMarkdown>
                          </Box>
                        ) : (
                          <Typography
                            sx={{
                              py: 1,
                              color: "text.secondary",
                              fontSize: 13,
                            }}
                          >
                            Markdownを入力すると、ここにプレビューが表示されます。
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <FormFieldLabel>
                    資料等へのリンク
                  </FormFieldLabel>

                  <TextField
                    fullWidth
                    size="small"
                    type="url"
                    value={form.documentUrl}
                    placeholder="例）https://example.com/slides.pdf"
                    onChange={(event) => {
                      handleChange(
                        "documentUrl",
                        event.target.value,
                      );
                    }}
                    sx={fieldStyle}
                  />

                  <FormFieldLabel>
                    Gitリポジトリへのリンク
                  </FormFieldLabel>

                  <TextField
                    fullWidth
                    size="small"
                    type="url"
                    value={form.repositoryUrl}
                    placeholder="例）https://github.com/example/repo"
                    onChange={(event) => {
                      handleChange(
                        "repositoryUrl",
                        event.target.value,
                      );
                    }}
                    sx={fieldStyle}
                  />

                  <FormFieldLabel>
                    発表者
                  </FormFieldLabel>

                  {ownStudentNumber && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        sx={{
                          mb: 0.7,
                          color: "#555555",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        あなた
                      </Typography>

                      <Box
                        sx={{
                          minHeight: 42,
                          px: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          border: "1px solid #d5d5d5",
                          borderRadius: 1,
                          bgcolor: "#f7f8fa",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: "#333333",
                            fontWeight: 600,
                          }}
                        >
                          {ownStudentNumber}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "#777777",
                          }}
                        >
                          自動登録
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Typography
                    sx={{
                      mb: 1,
                      color: "#555555",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {ownStudentNumber
                      ? "共同発表者"
                      : "発表者"}
                  </Typography>

                  <Typography
                    sx={{
                      mb: 1,
                      color: "#777777",
                      fontSize: 12,
                    }}
                  >
                    学籍番号を入力して追加してください
                  </Typography>

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
                      value={studentNumber}
                      placeholder="例）G23900"
                      error={Boolean(
                        presenterInputError,
                      )}
                      helperText={presenterInputError}
                      onChange={(event) => {
                        setStudentNumber(
                          event.target.value,
                        );
                        setPresenterInputError("");
                      }}
                    />

                    <Button
                      type="button"
                      variant="contained"
                      aria-label="発表者を追加"
                      onClick={handleAddPresenter}
                      sx={{
                        minWidth: 42,
                        width: 42,
                        height: 40,
                        p: 0,
                        bgcolor: "#172e5a",
                        "&:hover": {
                          bgcolor: "#102447",
                        },
                      }}
                    >
                      <Add />
                    </Button>
                  </Box>

                  {errors.presenters && (
                    <Typography
                      sx={{
                        mt: 0.8,
                        color: "error.main",
                        fontSize: 12,
                      }}
                    >
                      {errors.presenters}
                    </Typography>
                  )}

                  {form.presenters.length > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {form.presenters.map(
                        (presenter) => (
                          <Box
                            key={presenter}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1.2,
                              py: 0.7,
                              bgcolor: "#f0f2f6",
                              border:
                                "1px solid #d9dde5",
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: "#333333",
                                fontWeight: 600,
                              }}
                            >
                              {presenter}
                            </Typography>

                            <Button
                              type="button"
                              aria-label={`${presenter}を削除`}
                              onClick={() => {
                                handleRemovePresenter(
                                  presenter,
                                );
                              }}
                              sx={{
                                minWidth: 24,
                                width: 24,
                                height: 24,
                                p: 0,
                                color: "#777777",
                              }}
                            >
                              <Close
                                sx={{ fontSize: 16 }}
                              />
                            </Button>
                          </Box>
                        ),
                      )}
                    </Box>
                  )}

                  {saveError && (
                    <Alert
                      severity="error"
                      sx={{ mt: 3 }}
                    >
                      {saveError}
                    </Alert>
                  )}

                  <Box
                    sx={{
                      mt: 4,
                      pt: 3,
                      borderTop: "1px solid #eeeeee",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1.5,
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={isSaving}
                      onClick={handleCancel}
                      sx={{
                        color: "#555555",
                        borderColor: "#bbbbbb",
                        fontWeight: 700,
                        textTransform: "none",
                      }}
                    >
                      キャンセル
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSaving}
                      sx={{
                        minWidth: 120,
                        bgcolor: "#172e5a",
                        fontWeight: 700,
                        textTransform: "none",
                        "&:hover": {
                          bgcolor: "#102447",
                        },
                      }}
                    >
                      {isSaving ? (
                        <CircularProgress
                          size={20}
                          color="inherit"
                        />
                      ) : (
                        "変更を保存"
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
        </Box>
      </Box>
    </Box>
  );
}

function FormFieldLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Typography
      component="label"
      sx={{
        display: "block",
        mt: 2.5,
        mb: 0.8,
        color: "#333333",
        fontSize: 13,
        fontWeight: 700,
        "&:first-of-type": {
          mt: 0,
        },
      }}
    >
      {children}
    </Typography>
  );
}

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#ffffff",
  },
};