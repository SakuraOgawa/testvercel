import {
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import {
  ArrowBack,
  CheckCircle,
  School,
  Schedule,
} from "@mui/icons-material";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

import {
  useAuthContext,
} from "../hooks/useAuthContext";

/*
 * ========================================
 * TeacherRegisterPage
 * ========================================
 */

export default function TeacherRegisterPage() {
  const navigate =
    useNavigate();

  /*
   * ========================================
   * AuthContext
   * ========================================
   */

  const {
    session,
    profile,
  } = useAuthContext();

  /*
   * ========================================
   * State
   * ========================================
   */

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /*
   * ========================================
   * Auth / Profile Guard
   * ========================================
   *
   * App.tsxでも確認しているが、
   * TypeScript上ではnullの可能性があるため
   * このページでも確認する。
   */

  if (
    !session ||
    !profile
  ) {
    return null;
  }

  /*
   * ========================================
   * Google表示名
   * ========================================
   *
   * profilesには氏名を保存せず、
   * Google OAuth由来のmetadataを
   * 表示だけに使用する。
   */

  const displayName =
    session.user.user_metadata
      ?.full_name ??
    session.user.user_metadata
      ?.name ??
    "ユーザー";

  /*
   * ========================================
   * 教員申請
   * ========================================
   */

  const handleSubmit =
    async () => {
      setErrorMessage("");

      try {
        setIsSubmitting(true);

        /*
         * pending
         *   ↓
         * teacher_pending
         */

        const {
          error,
        } = await supabase.rpc(
          "request_teacher_registration",
        );

        if (error) {
          setErrorMessage(
            "教員登録を申請できませんでした。",
          );

          return;
        }

        /*
         * ========================================
         * Profile更新
         * ========================================
         *
         * useProfileが最新のroleを取得できるよう
         * 一度ページを読み直す。
         *
         * 再読み込み後は
         *
         * teacher_pending
         *
         * になっているため、
         * 下の承認待ち画面が表示される。
         */

        window.location.assign(
          "/register/teacher",
        );
      } catch {
        setErrorMessage(
          "教員登録を申請できませんでした。",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /*
   * ========================================
   * teacher_pending
   * ========================================
   *
   * 教員申請済みの場合は
   * 新規申請画面ではなく、
   * 管理者承認待ち画面を表示する。
   */

  if (
    profile.role ===
    "teacher_pending"
  ) {
    return (
      <Box
        sx={{
          minHeight:
            "100vh",

          bgcolor:
            "#f7f8fa",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          px: 2,

          py: 4,
        }}
      >
        <Box
          sx={{
            width:
              "100%",

            maxWidth:
              560,
          }}
        >
          {/* ================================= */}
          {/* システム名 */}
          {/* ================================= */}

          <Box
            sx={{
              mb: 3,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap: 1.5,

              color:
                "#172e5a",
            }}
          >
            <School
              sx={{
                fontSize: 36,
              }}
            />

            <Typography
              sx={{
                fontSize: {
                  xs: 20,
                  sm: 24,
                },

                fontWeight:
                  700,
              }}
            >
              卒業発表管理システム
            </Typography>
          </Box>

          {/* ================================= */}
          {/* 承認待ちカード */}
          {/* ================================= */}

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 3,
                sm: 5,
              },

              border:
                "1px solid #e0e0e0",

              borderRadius:
                2,

              bgcolor:
                "#ffffff",

              boxShadow:
                "0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            <Typography
              sx={{
                color:
                  "#172e5a",

                fontSize:
                  13,

                fontWeight:
                  700,

                textAlign:
                  "center",
              }}
            >
              {displayName} さん
            </Typography>

            {/* ================================= */}
            {/* アイコン */}
            {/* ================================= */}

            <Box
              sx={{
                mt: 3,

                display:
                  "flex",

                justifyContent:
                  "center",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,

                  borderRadius:
                    "50%",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  bgcolor:
                    "#eef3fb",

                  color:
                    "#172e5a",
                }}
              >
                <Schedule
                  sx={{
                    fontSize: 34,
                  }}
                />
              </Box>
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 2,

                color:
                  "#333333",

                fontSize: {
                  xs: 22,
                  sm: 26,
                },

                fontWeight:
                  700,

                textAlign:
                  "center",
              }}
            >
              教員登録を申請しました
            </Typography>

            <Typography
              sx={{
                mt: 1,

                color:
                  "text.secondary",

                fontSize:
                  13,

                lineHeight:
                  1.7,

                textAlign:
                  "center",
              }}
            >
              現在、管理者による承認待ちです。
              <br />
              承認されるまでお待ちください。
            </Typography>

            {/* ================================= */}
            {/* 申請内容 */}
            {/* ================================= */}

            <Box
              sx={{
                mt: 4,

                p: 3,

                borderRadius:
                  2,

                bgcolor:
                  "#f7f8fa",
              }}
            >
              <Typography
                sx={{
                  color:
                    "text.secondary",

                  fontSize:
                    12,

                  textAlign:
                    "center",
                }}
              >
                申請している利用区分
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color:
                    "#172e5a",

                  fontSize:
                    20,

                  fontWeight:
                    700,

                  textAlign:
                    "center",
                }}
              >
                教員
              </Typography>

              {profile.teacher_requested_at && (
                <Typography
                  sx={{
                    mt: 1,

                    color:
                      "text.secondary",

                    fontSize:
                      12,

                    textAlign:
                      "center",
                  }}
                >
                  申請日時：
                  {new Date(
                    profile.teacher_requested_at,
                  ).toLocaleString(
                    "ja-JP",
                  )}
                </Typography>
              )}
            </Box>

            {/* ================================= */}
            {/* ステータス */}
            {/* ================================= */}

            <Box
              sx={{
                mt: 3,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap: 1,

                color:
                  "#172e5a",
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 18,
                }}
              />

              <Typography
                sx={{
                  fontSize:
                    13,

                  fontWeight:
                    700,
                }}
              >
                申請受付済み
              </Typography>
            </Box>

            {/* ================================= */}
            {/* 発表会一覧へ */}
            {/* ================================= */}

            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                navigate(
                  "/events",
                );
              }}
              sx={{
                mt: 4,

                minHeight:
                  44,

                bgcolor:
                  "#172e5a",

                fontWeight:
                  700,

                textTransform:
                  "none",

                "&:hover": {
                  bgcolor:
                    "#102447",
                },
              }}
            >
              発表会一覧へ
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  /*
   * ========================================
   * 通常の教員申請画面
   * ========================================
   */

  return (
    <Box
      sx={{
        minHeight:
          "100vh",

        bgcolor:
          "#f7f8fa",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        px: 2,

        py: 4,
      }}
    >
      <Box
        sx={{
          width:
            "100%",

          maxWidth:
            560,
        }}
      >
        {/* ================================= */}
        {/* システム名 */}
        {/* ================================= */}

        <Box
          sx={{
            mb: 3,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            gap: 1.5,

            color:
              "#172e5a",
          }}
        >
          <School
            sx={{
              fontSize: 36,
            }}
          />

          <Typography
            sx={{
              fontSize: {
                xs: 20,
                sm: 24,
              },

              fontWeight:
                700,
            }}
          >
            卒業発表管理システム
          </Typography>
        </Box>

        {/* ================================= */}
        {/* 申請カード */}
        {/* ================================= */}

        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 3,
              sm: 5,
            },

            border:
              "1px solid #e0e0e0",

            borderRadius:
              2,

            bgcolor:
              "#ffffff",

            boxShadow:
              "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <Typography
            sx={{
              color:
                "#172e5a",

              fontSize:
                13,

              fontWeight:
                700,

              textAlign:
                "center",
            }}
          >
            {displayName} さん
          </Typography>

          {/* ================================= */}
          {/* タイトル */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 3,

              display:
                "flex",

              justifyContent:
                "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                bgcolor:
                  "#eef3fb",

                color:
                  "#172e5a",
              }}
            >
              <School
                sx={{
                  fontSize: 34,
                }}
              />
            </Box>
          </Box>

          <Typography
            component="h1"
            sx={{
              mt: 2,

              color:
                "#333333",

              fontSize: {
                xs: 22,
                sm: 26,
              },

              fontWeight:
                700,

              textAlign:
                "center",
            }}
          >
            教員として利用する
          </Typography>

          <Typography
            sx={{
              mt: 1,

              color:
                "text.secondary",

              fontSize:
                13,

              lineHeight:
                1.7,

              textAlign:
                "center",
            }}
          >
            教員として利用するには、
            管理者による承認が必要です。
          </Typography>

          {/* ================================= */}
          {/* 説明 */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 4,

              p: 3,

              borderRadius:
                2,

              bgcolor:
                "#f7f8fa",
            }}
          >
            <Typography
              sx={{
                color:
                  "#172e5a",

                fontSize:
                  14,

                fontWeight:
                  700,
              }}
            >
              教員として利用できる機能
            </Typography>

            <Typography
              sx={{
                mt: 1.5,

                color:
                  "text.secondary",

                fontSize:
                  13,

                lineHeight:
                  1.9,
              }}
            >
              ・発表会の作成
              <br />
              ・発表情報の登録
              <br />
              ・発表情報や学生情報の閲覧
            </Typography>
          </Box>

          {/* ================================= */}
          {/* 注意 */}
          {/* ================================= */}

          <Alert
            severity="info"
            sx={{
              mt: 3,

              textAlign:
                "left",
            }}
          >
            申請後は管理者による承認が完了するまで、
            教員向け機能を利用できません。
          </Alert>

          {/* ================================= */}
          {/* エラー */}
          {/* ================================= */}

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* ================================= */}
          {/* 申請 */}
          {/* ================================= */}

          <Button
            fullWidth
            variant="contained"
            disabled={
              isSubmitting
            }
            onClick={() => {
              void handleSubmit();
            }}
            sx={{
              mt: 4,

              minHeight:
                44,

              bgcolor:
                "#172e5a",

              fontWeight:
                700,

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
              "教員登録を申請"
            )}
          </Button>

          {/* ================================= */}
          {/* 戻る */}
          {/* ================================= */}

          <Button
            fullWidth
            startIcon={
              <ArrowBack />
            }
            disabled={
              isSubmitting
            }
            onClick={() => {
              navigate(
                "/register",
              );
            }}
            sx={{
              mt: 1.5,

              color:
                "text.secondary",

              fontWeight:
                700,

              textTransform:
                "none",
            }}
          >
            利用方法の選択に戻る
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}