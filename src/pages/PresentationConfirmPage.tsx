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

  // 入力画面を経由せず直接アクセスした場合
  if (!form) {
    return (
      <Navigate
        to="/presentations/new"
        replace
      />
    );
  }

  const handleBack = () => {
    navigate("/presentations/new", {
      state: {
        form,
      },
    });
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

  const handleRegister = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      /*
       * Supabaseのカラム名は、
       * 実際のテーブルに合わせて変更してください。
       */
      const { data, error } = await supabase
        .from("presentations")
        .insert({
          student_number:
            form.studentNumber,
          student_name:
            form.studentName,
          seminar_name:
            form.seminarName,
          title: form.title,
          summary: form.summary,
          document_url:
            form.documentUrl || null,
          repository_url:
            form.repositoryUrl || null,
          presentation_number:
            Number(
              form.presentationNumber,
            ),
          created_by: session.user.id,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      /*
       * 発表者を中間テーブルへ保存する場合の例です。
       * 発表者名ではなくIDで保存する方が適切です。
       */
      if (
        data &&
        form.presenters.length > 0
      ) {
        const memberRows =
          form.presenters.map(
            (presenterName) => ({
              presentation_id: data.id,
              presenter_name:
                presenterName,
            }),
          );

        const { error: memberError } =
          await supabase
            .from(
              "presentation_members",
            )
            .insert(memberRows);

        if (memberError) {
          throw memberError;
        }
      }

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "発表登録エラー:",
        error,
      );

      setErrorMessage(
        "登録に失敗しました。Supabaseのテーブル設定や入力内容を確認してください。",
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
            以下の内容で登録します。入力内容に間違いがないか確認してください。
          </Typography>

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
              <Box>
                <ConfirmItem
                  label="学籍番号"
                  value={form.studentNumber}
                />

                <ConfirmItem
                  label="氏名"
                  value={form.studentName}
                />

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
                    form.presenters.length >
                    0
                      ? form.presenters.join(
                          "、",
                        )
                      : ""
                  }
                />

                <ConfirmItem
                  label="発表番号"
                  value={
                    form.presentationNumber
                  }
                />
              </Box>
            </Box>
          </Paper>

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

          <Box
            sx={{
              mt: 3,
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
              variant="outlined"
              onClick={handleBack}
              disabled={isSubmitting}
              sx={{
                minWidth: 140,
                height: 44,
                color: "#333333",
                borderColor: "#bdbdbd",
                fontSize: 13,
                fontWeight: 700,
                textTransform: "none",
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
                textTransform: "none",

                "&:hover": {
                  bgcolor: "#102447",
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