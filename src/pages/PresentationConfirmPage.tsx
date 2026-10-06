import { useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import Sidebar, { drawerWidth } from "../components/Sidebar";
import { useAuthContext } from "../hooks/useAuthContext";
import { supabase } from "../lib/supabase";
import type { PresentationFormData } from "../types/presentationForm";
import "../styles/markdown.css";

type LocationState = {
  form?: PresentationFormData;
};

export default function PresentationConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { eventId } = useParams<{
    eventId: string;
  }>();

  const { session, profile } = useAuthContext();

  const locationState =
    location.state as LocationState | null;

  const form = locationState?.form;

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
   * 学生本人の学籍番号
   */
  const ownStudentNumber =
    profile?.student_number?.trim().toUpperCase() ?? "";

  /*
   * 実際に登録する発表者一覧
   *
   * student
   *   本人 + 共同発表者
   *
   * teacher / admin
   *   form.presenters
   */
  const presenterStudentNumbers = form
    ? [
        ...new Set([
          ...(ownStudentNumber
            ? [ownStudentNumber]
            : []),
          ...form.presenters.map((presenter) =>
            presenter.trim().toUpperCase(),
          ),
        ]),
      ].filter(Boolean)
    : [];

  const handleEdit = () => {
    if (!eventId || !form) {
      navigate("/events");
      return;
    }

    navigate(
      `/events/${eventId}/presentations/new`,
      {
        state: {
          form,
        },
      },
    );
  };

  const handleRegister = async () => {
    if (
      !eventId ||
      !form ||
      !session ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      /*
       * presentationsへ登録
       */
      const {
        data: presentation,
        error: presentationError,
      } = await supabase
        .from("presentations")
        .insert({
          event_id: eventId,
          seminar_name: form.seminarName.trim(),
          title: form.title.trim(),
          summary: form.summary,
          material_url:
            form.documentUrl.trim() || null,
          github_url:
            form.repositoryUrl.trim() || null,
          owner: session.user.id,
        })
        .select("id")
        .single();

      if (presentationError) {
        console.error(
          "発表登録エラー:",
          presentationError,
        );

        throw new Error(
          "発表情報を登録できませんでした。",
        );
      }

      if (!presentation) {
        throw new Error(
          "登録した発表のIDを取得できませんでした。",
        );
      }

      /*
       * presentersへ登録
       *
       * 学生の場合は本人の学籍番号も含む。
       */
      const presenterRows =
        presenterStudentNumbers.map(
          (studentNumber) => ({
            presentation_id:
              presentation.id,
            student_number:
              studentNumber,
          }),
        );

      if (presenterRows.length > 0) {
        const { error: presentersError } =
          await supabase
            .from("presenters")
            .insert(presenterRows);

        if (presentersError) {
          console.error(
            "発表者登録エラー:",
            presentersError,
          );

          throw new Error(
            "発表者情報を登録できませんでした。",
          );
        }
      }

      /*
       * 登録成功
       */
      navigate(
        `/events/${eventId}/presentations`,
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "登録処理エラー:",
        error,
      );

      if (error instanceof Error) {
        setErrorMessage(
          error.message,
        );
      } else {
        setErrorMessage(
          "登録中にエラーが発生しました。",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (!eventId) {
    return (
      <Navigate
        to="/events"
        replace
      />
    );
  }

  if (!form) {
    return (
      <Navigate
        to={`/events/${eventId}/presentations/new`}
        replace
      />
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
            width: "100%",
            maxWidth: 1100,
            px: {
              xs: 2,
              sm: 3,
              md: 4,
            },
            py: 4,
          }}
        >
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
              発表登録内容の確認
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "text.secondary",
                fontSize: 13,
              }}
            >
              以下の内容で発表を登録します。
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              border: "1px solid #dddddd",
              borderRadius: 2,
              bgcolor: "#ffffff",
              overflow: "hidden",
            }}
          >
            <ConfirmItem
              label="ゼミ名（教員名）"
              value={form.seminarName}
            />

            <ConfirmItem
              label="タイトル"
              value={form.title}
            />

            <ConfirmItem
              label="発表概要"
            >
              {form.summary.trim() ? (
                <Box className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
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
                    color:
                      "text.secondary",
                    fontSize: 13,
                  }}
                >
                  未入力
                </Typography>
              )}
            </ConfirmItem>

            <ConfirmItem
              label="資料等へのリンク"
            >
              {form.documentUrl ? (
                <Typography
                  component="a"
                  href={
                    form.documentUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "#1756a9",
                    fontSize: 13,
                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {form.documentUrl}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    color:
                      "text.secondary",
                    fontSize: 13,
                  }}
                >
                  未設定
                </Typography>
              )}
            </ConfirmItem>

            <ConfirmItem
              label="Gitリポジトリへのリンク"
            >
              {form.repositoryUrl ? (
                <Typography
                  component="a"
                  href={
                    form.repositoryUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "#1756a9",
                    fontSize: 13,
                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {form.repositoryUrl}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    color:
                      "text.secondary",
                    fontSize: 13,
                  }}
                >
                  未設定
                </Typography>
              )}
            </ConfirmItem>

            <ConfirmItem
              label="発表者（学籍番号）"
              isLast
            >
              {presenterStudentNumbers.length >
              0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {presenterStudentNumbers.map(
                    (studentNumber) => (
                      <Box
                        key={
                          studentNumber
                        }
                        sx={{
                          px: 1.2,
                          py: 0.7,
                          bgcolor:
                            "#f0f2f6",
                          border:
                            "1px solid #d9dde5",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              "#333333",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {
                            studentNumber
                          }
                          {studentNumber ===
                            ownStudentNumber &&
                            "（あなた）"}
                        </Typography>
                      </Box>
                    ),
                  )}
                </Box>
              ) : (
                <Typography
                  sx={{
                    color:
                      "text.secondary",
                    fontSize: 13,
                  }}
                >
                  発表者なし
                </Typography>
              )}
            </ConfirmItem>
          </Box>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
            >
              {errorMessage}
            </Alert>
          )}

          <Box
            sx={{
              mt: 4,
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
              disabled={isSubmitting}
              onClick={handleEdit}
              sx={{
                width: {
                  xs: "100%",
                  sm: 160,
                },
                height: 44,
                color: "#555555",
                borderColor:
                  "#bbbbbb",
                fontWeight: 700,
                textTransform:
                  "none",
                "&:hover": {
                  borderColor:
                    "#999999",
                  bgcolor:
                    "#fafafa",
                },
              }}
            >
              入力内容を修正
            </Button>

            <Button
              type="button"
              variant="contained"
              disabled={isSubmitting}
              onClick={() => {
                void handleRegister();
              }}
              sx={{
                width: {
                  xs: "100%",
                  sm: 160,
                },
                height: 44,
                bgcolor: "#172e5a",
                fontWeight: 700,
                textTransform:
                  "none",
                "&:hover": {
                  bgcolor:
                    "#102447",
                },
              }}
            >
              {isSubmitting ? (
                <CircularProgress
                  size={22}
                  color="inherit"
                />
              ) : (
                "この内容で登録"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

type ConfirmItemProps = {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  isLast?: boolean;
};

function ConfirmItem({
  label,
  value,
  children,
  isLast = false,
}: ConfirmItemProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "220px minmax(0, 1fr)",
        },
        borderBottom:
          isLast
            ? "none"
            : "1px solid #eeeeee",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2,
          bgcolor: "#f7f8fa",
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#333333",
          }}
        >
          {label}
        </Typography>
      </Box>

      <Box
        sx={{
          px: 2,
          py: 2,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {children ?? (
          <Typography
            sx={{
              fontSize: 13,
              color: "#333333",
              overflowWrap:
                "anywhere",
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}