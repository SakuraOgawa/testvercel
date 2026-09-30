import {
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import {
  ArrowForward,
  Logout,
  Person,
  School,
} from "@mui/icons-material";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useAuthContext,
} from "../hooks/useAuthContext";

import {
  supabase,
} from "../lib/supabase";

/*
 * ========================================
 * RegisterPage
 * ========================================
 */

export default function RegisterPage() {
  const navigate =
    useNavigate();

  /*
   * ========================================
   * AuthContext
   * ========================================
   */

  const {
    session,
  } = useAuthContext();

  /*
   * ========================================
   * Googleアカウント情報
   * ========================================
   */

  const displayName =
    session?.user
      .user_metadata
      ?.full_name ??
    session?.user
      .user_metadata
      ?.name ??
    "ユーザー";

  /*
   * ========================================
   * 学生として利用
   * ========================================
   */

  const handleStudent =
    () => {
      navigate(
        "/register/student",
      );
    };

  /*
   * ========================================
   * 教員として利用
   * ========================================
   */

  const handleTeacher =
    () => {
      navigate(
        "/register/teacher",
      );
    };

  /*
   * ========================================
   * あとで登録
   * ========================================
   */

  const handleRegisterLater =
    () => {
      navigate(
        "/events",
      );
    };

  /*
   * ========================================
   * ログアウト
   * ========================================
   */

  const handleLogout =
    async () => {
      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "ログアウトエラー:",
          error,
        );

        return;
      }

      /*
       * AuthContext側で
       * onAuthStateChangeを監視しているため、
       * signOut後はsessionがnullになる。
       */
    };

  /*
   * ========================================
   * 未ログイン
   * ========================================
   */

  if (!session) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
   * ========================================
   * Render
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
            760,
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
              fontSize:
                38,
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
        {/* メインカード */}
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

            boxShadow:
              "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          {/* Google表示名 */}

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
            利用方法を選択してください
          </Typography>

          <Typography
            sx={{
              mt: 1,

              color:
                "text.secondary",

              fontSize:
                13,

              textAlign:
                "center",
            }}
          >
            利用者情報はあとから登録することもできます。
          </Typography>

          {/* ================================= */}
          {/* 選択肢 */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 4,

              display:
                "grid",

              gridTemplateColumns:
                {
                  xs:
                    "1fr",

                  sm:
                    "1fr 1fr",
                },

              gap: 2,
            }}
          >
            {/* ============================= */}
            {/* 学生 */}
            {/* ============================= */}

            <Paper
              variant="outlined"
              sx={{
                p: 3,

                display:
                  "flex",

                flexDirection:
                  "column",

                borderRadius:
                  2,

                borderColor:
                  "#d8dce5",
              }}
            >
              <Box
                sx={{
                  width:
                    52,

                  height:
                    52,

                  mb: 2,

                  display:
                    "grid",

                  placeItems:
                    "center",

                  borderRadius:
                    "50%",

                  bgcolor:
                    "rgba(23,46,90,0.08)",

                  color:
                    "#172e5a",
                }}
              >
                <Person
                  sx={{
                    fontSize:
                      28,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  color:
                    "#333333",

                  fontSize:
                    18,

                  fontWeight:
                    700,
                }}
              >
                学生
              </Typography>

              <Typography
                sx={{
                  mt: 1,

                  minHeight:
                    42,

                  color:
                    "text.secondary",

                  fontSize:
                    13,

                  lineHeight:
                    1.7,
                }}
              >
                学籍番号を登録して、
                発表情報の登録・確認を行います。
              </Typography>

              <Button
                variant="contained"
                endIcon={
                  <ArrowForward />
                }
                onClick={
                  handleStudent
                }
                sx={{
                  mt: 3,

                  bgcolor:
                    "#172e5a",

                  fontWeight:
                    700,

                  textTransform:
                    "none",

                  "&:hover":
                    {
                      bgcolor:
                        "#102447",
                    },
                }}
              >
                学生として利用
              </Button>
            </Paper>

            {/* ============================= */}
            {/* 教員 */}
            {/* ============================= */}

            <Paper
              variant="outlined"
              sx={{
                p: 3,

                display:
                  "flex",

                flexDirection:
                  "column",

                borderRadius:
                  2,

                borderColor:
                  "#d8dce5",
              }}
            >
              <Box
                sx={{
                  width:
                    52,

                  height:
                    52,

                  mb: 2,

                  display:
                    "grid",

                  placeItems:
                    "center",

                  borderRadius:
                    "50%",

                  bgcolor:
                    "rgba(23,46,90,0.08)",

                  color:
                    "#172e5a",
                }}
              >
                <School
                  sx={{
                    fontSize:
                      28,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  color:
                    "#333333",

                  fontSize:
                    18,

                  fontWeight:
                    700,
                }}
              >
                教員
              </Typography>

              <Typography
                sx={{
                  mt: 1,

                  minHeight:
                    42,

                  color:
                    "text.secondary",

                  fontSize:
                    13,

                  lineHeight:
                    1.7,
                }}
              >
                教員として利用するには、
                管理者による承認が必要です。
              </Typography>

              <Button
                variant="outlined"
                endIcon={
                  <ArrowForward />
                }
                onClick={
                  handleTeacher
                }
                sx={{
                  mt: 3,

                  color:
                    "#172e5a",

                  borderColor:
                    "#172e5a",

                  fontWeight:
                    700,

                  textTransform:
                    "none",

                  "&:hover":
                    {
                      borderColor:
                        "#102447",

                      bgcolor:
                        "rgba(23,46,90,0.04)",
                    },
                }}
              >
                教員として利用
              </Button>
            </Paper>
          </Box>

          {/* ================================= */}
          {/* あとで登録 */}
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
            <Button
              onClick={
                handleRegisterLater
              }
              sx={{
                color:
                  "#172e5a",

                fontSize:
                  13,

                fontWeight:
                  700,

                textTransform:
                  "none",
              }}
            >
              あとで登録する
            </Button>
          </Box>

          {/* ================================= */}
          {/* ログアウト */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 1,

              display:
                "flex",

              justifyContent:
                "center",
            }}
          >
            <Button
              startIcon={
                <Logout />
              }
              onClick={() => {
                void handleLogout();
              }}
              sx={{
                color:
                  "text.secondary",

                fontSize:
                  12,

                fontWeight:
                  700,

                textTransform:
                  "none",
              }}
            >
              別のGoogleアカウントを使用する
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}