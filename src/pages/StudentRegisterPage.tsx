import {
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
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
 * StudentRegisterPage
 * ========================================
 */

export default function StudentRegisterPage() {
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
    studentNumber,
    setStudentNumber,
  ] = useState("");

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
   * App.tsx側でも認証状態を確認しているが、
   * TypeScript上ではsession/profileが
   * nullの可能性があるためここでも確認する。
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
   */

  const displayName =
    session.user.user_metadata
      ?.full_name ??
    session.user.user_metadata
      ?.name ??
    "ユーザー";

  /*
   * ========================================
   * 学生登録
   * ========================================
   */

  const handleSubmit =
    async () => {
      const normalizedStudentNumber =
        studentNumber
          .trim()
          .toUpperCase();

      setErrorMessage("");

      /*
       * ========================================
       * 入力チェック
       * ========================================
       */

      if (
        !normalizedStudentNumber
      ) {
        setErrorMessage(
          "学籍番号を入力してください。",
        );

        return;
      }

      try {
        setIsSubmitting(true);

        /*
         * ========================================
         * 学生登録申請RPC
         * ========================================
         *
         * 現在の仕様では、
         *
         * pending
         *   ↓
         * student_pending
         *
         * となる。
         *
         * student_numberにはまだ登録せず、
         * requested_student_numberに保存される。
         */

        const {
          error,
        } = await supabase.rpc(
          "complete_student_registration",
          {
            p_student_number:
              normalizedStudentNumber,
          },
        );

        if (error) {
          /*
           * RPC側から返された
           * メッセージを確認する。
           */

          if (
            error.message.includes(
              "すでに使用",
            )
          ) {
            setErrorMessage(
              "この学籍番号はすでに使用されています。",
            );

            return;
          }

          if (
            error.message.includes(
              "すでに申請",
            )
          ) {
            setErrorMessage(
              "この学籍番号はすでに申請されています。",
            );

            return;
          }

          /*
           * UNIQUE制約違反にも対応
           */

          if (
            error.code ===
            "23505"
          ) {
            setErrorMessage(
              "この学籍番号はすでに登録されています。",
            );

            return;
          }

          setErrorMessage(
            "学生登録を申請できませんでした。",
          );

          return;
        }

        /*
         * ========================================
         * 登録申請完了
         * ========================================
         *
         * Profileを最新状態にするため
         * ページを再読み込みする。
         *
         * pending
         *   ↓
         * student_pending
         *
         * になっているので、
         * 再読み込み後は下の
         * 「承認待ち画面」が表示される。
         */

        window.location.assign(
          "/register/student",
        );
      } catch {
        setErrorMessage(
          "学生登録を申請できませんでした。",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  /*
   * ========================================
   * student_pending
   * ========================================
   *
   * 学生登録申請済みの場合は、
   * 登録フォームではなく
   * 管理者承認待ち画面を表示する。
   */

  if (
    profile.role ===
    "student_pending"
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
              学生登録を申請しました
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
                申請中の学籍番号
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color:
                    "#172e5a",

                  fontSize:
                    22,

                  fontWeight:
                    700,

                  textAlign:
                    "center",

                  letterSpacing:
                    1,
                }}
              >
                {profile
                  .requested_student_number ??
                  "－"}
              </Typography>
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
   * 通常の学生登録画面
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
        {/* 登録カード */}
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

          <Typography
            component="h1"
            sx={{
              mt: 1,

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
            学生情報の登録
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
            卒業発表管理システムで使用する
            学籍番号を申請してください。
          </Typography>

          {/* ================================= */}
          {/* エラー */}
          {/* ================================= */}

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mt: 3,
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* ================================= */}
          {/* 学籍番号 */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 4,
            }}
          >
            <Typography
              component="label"
              htmlFor="student-number"
              sx={{
                mb: 1,

                display:
                  "block",

                color:
                  "#333333",

                fontSize:
                  13,

                fontWeight:
                  700,
              }}
            >
              学籍番号
            </Typography>

            <TextField
              id="student-number"
              fullWidth
              autoFocus
              value={
                studentNumber
              }
              placeholder="例）G23934"
              disabled={
                isSubmitting
              }
              onChange={(
                event,
              ) => {
                setStudentNumber(
                  event.target
                    .value,
                );

                if (
                  errorMessage
                ) {
                  setErrorMessage(
                    "",
                  );
                }
              }}
              slotProps={{
                htmlInput: {
                  maxLength:
                    20,
                },
              }}
            />

            <Typography
              sx={{
                mt: 1,

                color:
                  "text.secondary",

                fontSize:
                  12,
              }}
            >
              入力した学籍番号は、
              管理者による承認後に登録されます。
            </Typography>
          </Box>

          {/* ================================= */}
          {/* 申請ボタン */}
          {/* ================================= */}

          <Button
            fullWidth
            variant="contained"
            disabled={
              isSubmitting ||
              !studentNumber.trim()
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
              "学生登録を申請"
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