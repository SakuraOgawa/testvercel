import {
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
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

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import { supabase } from "../lib/supabase";

import type {
  PresentationFormData,
} from "../types/presentationForm";

type PresentationConfirmPageProps = {
  session: Session;
};

type LocationState = {
  form?: PresentationFormData;
};

export default function PresentationConfirmPage({
  session,
}: PresentationConfirmPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * URL
   *
   * /events/:eventId/presentations/confirm
   *
   * からeventIdを取得
   */
  const { eventId } = useParams<{
    eventId: string;
  }>();

  /*
   * PresentationCreatePageから
   * 渡された入力内容を取得
   */
  const locationState =
    location.state as
      | LocationState
      | null;

  const form =
    locationState?.form;

  /*
   * 登録処理中
   */
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /*
   * 登録エラー
   */
  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * ========================================
   * 入力内容を修正
   * ========================================
   */
  const handleEdit = () => {
    if (!eventId || !form) {
      navigate("/events");
      return;
    }

    /*
     * 入力内容をstateで渡したまま
     * 新規登録画面へ戻る
     */
    navigate(
      `/events/${eventId}/presentations/new`,
      {
        state: {
          form,
        },
      },
    );
  };

  /*
   * ========================================
   * Supabaseへ登録
   * ========================================
   */
  const handleRegister =
    async () => {
      if (
        !eventId ||
        !form ||
        isSubmitting
      ) {
        return;
      }

      setIsSubmitting(true);
      setErrorMessage("");

      try {
        /*
         * ----------------------------------
         * presentationsへ登録
         * ----------------------------------
         */
        const {
          data: presentation,
          error: presentationError,
        } = await supabase
          .from("presentations")
          .insert({
            /*
             * どの発表会に所属するか
             */
            event_id: eventId,

            seminar_name:
              form.seminarName.trim(),

            title:
              form.title.trim(),

            summary:
              form.summary.trim(),

            material_url:
              form.documentUrl.trim()
                ? form.documentUrl.trim()
                : null,

            github_url:
              form.repositoryUrl.trim()
                ? form.repositoryUrl.trim()
                : null,

            /*
             * 登録したユーザー
             */
            owner:
              session.user.id,
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
         * ----------------------------------
         * presentersへ学籍番号を登録
         * ----------------------------------
         */
        const presenterRows =
          form.presenters.map(
            (studentNumber) => ({
              presentation_id:
                presentation.id,

              student_number:
                studentNumber
                  .trim()
                  .toUpperCase(),
            }),
          );

        if (
          presenterRows.length > 0
        ) {
          const {
            error: presentersError,
          } = await supabase
            .from("presenters")
            .insert(
              presenterRows,
            );

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
         * ----------------------------------
         * 登録成功
         *
         * 選択中の発表会の一覧へ戻る
         * ----------------------------------
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

        if (
          error instanceof Error
        ) {
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

  /*
   * ========================================
   * ログアウト
   * ========================================
   */
  const handleLogout =
    async () => {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "ログアウトエラー:",
          error,
        );
      }
    };

  /*
   * ========================================
   * eventIdがない
   * ========================================
   */
  if (!eventId) {
    return (
      <Navigate
        to="/events"
        replace
      />
    );
  }

  /*
   * ========================================
   * 入力データがない
   *
   * URLを直接入力して
   * confirmへ来た場合など
   * ========================================
   */
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
        bgcolor: "#ffffff",
      }}
    >
      {/* ================================= */}
      {/* Sidebar */}
      {/* ================================= */}

      <Sidebar
        session={session}
        onLogout={() => {
          void handleLogout();
        }}
      />

      {/* ================================= */}
      {/* Main */}
      {/* ================================= */}

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
          sx={{
            width: "100%",

            maxWidth: 1000,

            px: {
              xs: 2,
              sm: 3,
              md: 4.5,
            },

            pt: 4,
            pb: 5,
          }}
        >
          {/* ================================= */}
          {/* タイトル */}
          {/* ================================= */}

          <Typography
            component="h1"
            sx={{
              mb: 1,

              fontSize: 22,

              fontWeight: 700,

              color: "#333333",
            }}
          >
            発表登録内容の確認
          </Typography>

          <Typography
            sx={{
              mb: 4,

              color: "#777777",

              fontSize: 13,
            }}
          >
            以下の内容で登録します。
          </Typography>

          {/* ================================= */}
          {/* 確認内容 */}
          {/* ================================= */}

          <Box
            sx={{
              width: "100%",

              border:
                "1px solid #dddddd",

              borderRadius: 2,

              bgcolor: "#ffffff",

              overflow: "hidden",

              boxShadow:
                "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <ConfirmItem
              label="ゼミ名（教員名）"
              value={
                form.seminarName
              }
            />

            <ConfirmItem
              label="タイトル"
              value={form.title}
            />

            <ConfirmItem
              label="発表概要"
              value={form.summary}
              multiline
            />

            <ConfirmItem
              label="資料等へのリンク"
              value={
                form.documentUrl ||
                "未設定"
              }
            />

            <ConfirmItem
              label="Gitリポジトリへのリンク"
              value={
                form.repositoryUrl ||
                "未設定"
              }
            />

            <ConfirmItem
              label="発表者（学籍番号）"
              value={
                form.presenters
                  .join("、")
              }
              isLast
            />
          </Box>

          {/* ================================= */}
          {/* エラー */}
          {/* ================================= */}

          {errorMessage && (
            <Typography
              role="alert"
              sx={{
                mt: 2,

                color:
                  "error.main",

                fontSize: 13,
              }}
            >
              {errorMessage}
            </Typography>
          )}

          {/* ================================= */}
          {/* ボタン */}
          {/* ================================= */}

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
            {/* 入力内容を修正 */}

            <Button
              type="button"

              variant="outlined"

              disabled={
                isSubmitting
              }

              onClick={
                handleEdit
              }

              sx={{
                width: {
                  xs: "100%",
                  sm: 160,
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
                  "0 2px 4px rgba(0,0,0,0.08)",

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

            {/* 登録 */}

            <Button
              type="button"

              variant="contained"

              disabled={
                isSubmitting
              }

              onClick={() => {
                void handleRegister();
              }}

              sx={{
                width: {
                  xs: "100%",
                  sm: 160,
                },

                height: 44,

                bgcolor:
                  "#172e5a",

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

/*
 * ==========================================
 * 確認項目
 * ==========================================
 */

type ConfirmItemProps = {
  label: string;
  value: ReactNode;

  multiline?: boolean;
  isLast?: boolean;
};

function ConfirmItem({
  label,
  value,
  multiline = false,
  isLast = false,
}: ConfirmItemProps) {
  return (
    <Box
      sx={{
        display: "grid",

        gridTemplateColumns: {
          xs: "1fr",
          sm: "220px 1fr",
        },

        borderBottom:
          isLast
            ? "none"
            : "1px solid #eeeeee",
      }}
    >
      {/* ラベル */}

      <Box
        sx={{
          px: 2,
          py: 2,

          bgcolor:
            "#f7f8fa",
        }}
      >
        <Typography
          sx={{
            fontSize: 13,

            fontWeight: 700,

            color:
              "#333333",
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* 値 */}

      <Box
        sx={{
          px: 2,
          py: 2,

          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,

            color:
              "#333333",

            whiteSpace:
              multiline
                ? "pre-wrap"
                : "normal",

            overflowWrap:
              "anywhere",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}