import { useState } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import ConfirmItem from "../components/ConfirmItem";

import { supabase } from "../lib/supabase";

import type { PresentationFormData } from "../types/presantationForm";

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

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const locationState =
    location.state as LocationState | null;

  const form = locationState?.form;

  /*
   * 登録画面を経由せず
   * 確認画面へ直接アクセスした場合
   */
  if (!form) {
    return (
      <Navigate
        to="/presentations/new"
        replace
      />
    );
  }

  /*
   * 入力画面へ戻る
   *
   * formをstateで渡しているので、
   * 入力内容を保持したまま戻ることができる
   */
  const handleBack = () => {
    navigate("/presentations/new", {
      state: {
        form,
      },
    });
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

  /*
   * Supabaseへ登録
   */
  const handleRegister = async () => {
    /*
     * 二重クリック防止
     */
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      /*
       * ========================================
       * 1. presentationsテーブルへ発表を登録
       * ========================================
       */

      const {
        data: presentation,
        error: presentationError,
      } = await supabase
        .from("presentations")
        .insert({
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
           * Googleログイン中の
           * SupabaseユーザーID
           */
          owner: session.user.id,
        })
        /*
         * INSERTした発表のidだけ取得
         */
        .select("id")
        .single();

      if (presentationError) {
        throw presentationError;
      }

      if (!presentation) {
        throw new Error(
          "登録した発表のIDを取得できませんでした。",
        );
      }

      /*
       * ========================================
       * 2. presentersテーブル用のデータを作る
       * ========================================
       *
       * 例：
       *
       * presenters:
       * [
       *   "山田太郎",
       *   "佐藤花子"
       * ]
       *
       * ↓
       *
       * [
       *   {
       *     presentation_id: "...",
       *     presenter_name: "山田太郎"
       *   },
       *   {
       *     presentation_id: "...",
       *     presenter_name: "佐藤花子"
       *   }
       * ]
       */

      const presenterRows =
        form.presenters.map(
          (presenterName) => ({
            presentation_id:
              presentation.id,

            presenter_name:
              presenterName.trim(),
          }),
        );

      /*
       * ========================================
       * 3. presentersへまとめて登録
       * ========================================
       */

      const {
        error: presentersError,
      } = await supabase
        .from("presenters")
        .insert(presenterRows);

      if (presentersError) {
        throw presentersError;
      }

      /*
       * ========================================
       * 4. 登録成功
       * ========================================
       */

      console.log(
        "発表登録成功:",
        presentation.id,
      );

      /*
       * 一覧画面へ戻る
       */
      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "発表登録エラー:",
        error,
      );

      setErrorMessage(
        "発表の登録に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f8fa",
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
          sx={{
            width: "100%",
            maxWidth: 1000,
            mx: "auto",

            px: {
              xs: 2,
              sm: 3,
              md: 4,
            },

            py: 4,
          }}
        >
          {/* ============================= */}
          {/* タイトル */}
          {/* ============================= */}

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
              mb: 3,
              color: "text.secondary",
              fontSize: 13,
            }}
          >
            以下の内容で登録します。
            入力内容に間違いがないか確認してください。
          </Typography>

          {/* ============================= */}
          {/* 確認内容 */}
          {/* ============================= */}

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },

              border:
                "1px solid #dedede",

              borderRadius: 2,

              bgcolor: "#ffffff",
            }}
          >
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },

                columnGap: 5,
              }}
            >
              {/* ============================= */}
              {/* 左側 */}
              {/* ============================= */}

              <Box>
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
                  value={form.summary}
                  multiline
                />
              </Box>

              {/* ============================= */}
              {/* 右側 */}
              {/* ============================= */}

              <Box>
                <ConfirmItem
                  label="資料等へのリンク"
                  value={form.documentUrl}
                  isLink
                />

                <ConfirmItem
                  label="Gitリポジトリへのリンク"
                  value={
                    form.repositoryUrl
                  }
                  isLink
                />

                <ConfirmItem
                  label="発表者"
                  value={
                    form.presenters.length > 0
                      ? form.presenters.join(
                          "、",
                        )
                      : ""
                  }
                />
              </Box>
            </Box>
          </Paper>

          {/* ============================= */}
          {/* Supabase登録エラー */}
          {/* ============================= */}

          {errorMessage && (
            <Typography
              role="alert"
              sx={{
                mt: 2,
                color: "error.main",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </Typography>
          )}

          {/* ============================= */}
          {/* ボタン */}
          {/* ============================= */}

          <Box
            sx={{
              mt: 3,

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
              variant="outlined"
              onClick={handleBack}
              disabled={isSubmitting}
              sx={{
                minWidth: 140,
                height: 44,

                color: "#333333",

                borderColor:
                  "#bdbdbd",

                fontSize: 13,
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
              variant="contained"
              onClick={() => {
                void handleRegister();
              }}
              disabled={isSubmitting}
              sx={{
                minWidth: 160,
                height: 44,

                bgcolor: "#172e5a",

                fontSize: 13,
                fontWeight: 700,

                textTransform:
                  "none",

                "&:hover": {
                  bgcolor:
                    "#102447",
                },
              }}
            >
              {isSubmitting
                ? "登録中..."
                : "この内容で登録"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}