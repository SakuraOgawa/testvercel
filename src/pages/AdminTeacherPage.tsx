import {
  useEffect,
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
  AdminPanelSettings,
  Check,
  Close,
  Refresh,
} from "@mui/icons-material";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

/*
 * ========================================
 * 型
 * ========================================
 */

type TeacherRequest = {
  user_id: string;

  display_name: string;

  requested_at:
    string | null;
};

/*
 * ========================================
 * Component
 * ========================================
 */

export default function AdminTeacherPage() {
  const navigate =
    useNavigate();

  const [
    requests,
    setRequests,
  ] = useState<
    TeacherRequest[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    processingUserId,
    setProcessingUserId,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * ========================================
   * 初回取得 + Realtime
   * ========================================
   */

  useEffect(() => {
    let isCancelled =
      false;

    /*
     * ======================================
     * 教員申請一覧取得
     * ======================================
     */

    const fetchRequests =
      async () => {
        const {
          data,
          error,
        } = await supabase.rpc(
          "get_pending_teacher_requests",
        );

        /*
         * ページ破棄後なら
         * stateを変更しない
         */
        if (isCancelled) {
          return;
        }

        if (error) {
          setErrorMessage(
            "教員申請を取得できませんでした。",
          );

          setIsLoading(
            false,
          );

          return;
        }

        setRequests(
          (data ?? []) as
            TeacherRequest[],
        );

        setErrorMessage("");

        setIsLoading(
          false,
        );
      };

    /*
     * ======================================
     * 初回取得
     * ======================================
     */

    void fetchRequests();

    /*
     * ======================================
     * Realtime
     * ======================================
     *
     * profilesテーブルにUPDATEが入ったら
     * 教員申請一覧を再取得する。
     *
     * 例：
     *
     * pending
     *   ↓ 教員申請
     * teacher_pending
     *
     * teacher_pending
     *   ↓ 承認
     * teacher
     *
     * teacher_pending
     *   ↓ 却下
     * pending
     */

    const channel =
      supabase
        .channel(
          "admin-teacher-requests",
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",

            schema: "public",

            table: "profiles",
          },
          () => {
            /*
             * Realtimeイベントを受信したら
             * DBから最新一覧を再取得
             */
            void fetchRequests();
          },
        )
        .subscribe();

    /*
     * ======================================
     * Cleanup
     * ======================================
     */

    return () => {
      isCancelled = true;

      void supabase.removeChannel(
        channel,
      );
    };
  }, []);

  /*
   * ========================================
   * 手動更新
   * ========================================
   */

  const handleRefresh =
    async () => {
      setIsLoading(true);

      setErrorMessage("");

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_pending_teacher_requests",
      );

      if (error) {
        setErrorMessage(
          "教員申請を取得できませんでした。",
        );

        setIsLoading(false);

        return;
      }

      setRequests(
        (data ?? []) as
          TeacherRequest[],
      );

      setIsLoading(false);
    };

  /*
   * ========================================
   * 承認
   * ========================================
   */

  const handleApprove =
    async (
      userId: string,
    ) => {
      setProcessingUserId(
        userId,
      );

      setErrorMessage("");

      const {
        error,
      } = await supabase.rpc(
        "approve_teacher",
        {
          p_user_id:
            userId,
        },
      );

      if (error) {
        setErrorMessage(
          error.message ||
            "教員申請を承認できませんでした。",
        );

        setProcessingUserId(
          null,
        );

        return;
      }

      /*
       * ここではrequestsを
       * 手動変更しない。
       *
       * approve_teacher()
       *        ↓
       * profiles UPDATE
       *        ↓
       * Realtime
       *        ↓
       * fetchRequests()
       *
       * に任せる。
       */

      setProcessingUserId(
        null,
      );
    };

  /*
   * ========================================
   * 却下
   * ========================================
   */

  const handleReject =
    async (
      userId: string,
    ) => {
      setProcessingUserId(
        userId,
      );

      setErrorMessage("");

      const {
        error,
      } = await supabase.rpc(
        "reject_teacher",
        {
          p_user_id:
            userId,
        },
      );

      if (error) {
        setErrorMessage(
          error.message ||
            "教員申請を却下できませんでした。",
        );

        setProcessingUserId(
          null,
        );

        return;
      }

      /*
       * reject_teacher()
       *        ↓
       * profiles UPDATE
       *        ↓
       * Realtime
       *        ↓
       * fetchRequests()
       */

      setProcessingUserId(
        null,
      );
    };

  /*
   * ========================================
   * 日時表示
   * ========================================
   */

  const formatDateTime = (
    value: string | null,
  ) => {
    if (!value) {
      return "不明";
    }

    return new Intl.DateTimeFormat(
      "ja-JP",
      {
        year: "numeric",

        month: "2-digit",

        day: "2-digit",

        hour: "2-digit",

        minute: "2-digit",
      },
    ).format(
      new Date(value),
    );
  };

  /*
   * ========================================
   * JSX
   * ========================================
   */

  return (
    <Box
      sx={{
        minHeight:
          "100vh",

        bgcolor:
          "#f7f8fa",
      }}
    >
      {/* ================================= */}
      {/* Sidebar */}
      {/* ================================= */}

      <Sidebar />

      {/* ================================= */}
      {/* Main */}
      {/* ================================= */}

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,

            md: `${drawerWidth}px`,
          },

          px: {
            xs: 2,

            md: 4,
          },

          py: 4,
        }}
      >
        <Box
          sx={{
            maxWidth: 1000,

            mx: "auto",
          }}
        >
          {/* ============================= */}
          {/* Header */}
          {/* ============================= */}

          <Box
            sx={{
              mb: 4,

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap: 2,
            }}
          >
            <Box>
              <Box
                sx={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap: 1.5,
                }}
              >
                <AdminPanelSettings
                  sx={{
                    color:
                      "#172e5a",

                    fontSize:
                      30,
                  }}
                />

                <Typography
                  component="h1"
                  sx={{
                    fontSize:
                      24,

                    fontWeight:
                      700,

                    color:
                      "#172e5a",
                  }}
                >
                  教員申請管理
                </Typography>
              </Box>

              <Typography
                sx={{
                  mt: 1,

                  color:
                    "text.secondary",

                  fontSize:
                    13,
                }}
              >
                教員として申請されたユーザーを確認し、
                承認または却下します。
              </Typography>
            </Box>

            {/* ============================= */}
            {/* 更新 */}
            {/* ============================= */}

            <Button
              variant="outlined"
              startIcon={
                <Refresh />
              }
              disabled={
                isLoading
              }
              onClick={() => {
                void handleRefresh();
              }}
              sx={{
                flexShrink:
                  0,

                color:
                  "#172e5a",

                borderColor:
                  "#172e5a",

                textTransform:
                  "none",

                "&:hover": {
                  borderColor:
                    "#102447",

                  bgcolor:
                    "rgba(23,46,90,0.04)",
                },
              }}
            >
              更新
            </Button>
          </Box>

          {/* ============================= */}
          {/* Realtime */}
          {/* ============================= */}

          <Alert
            severity="info"
            sx={{
              mb: 3,
            }}
          >
            教員申請一覧はリアルタイムで更新されます。
          </Alert>

          {/* ============================= */}
          {/* Error */}
          {/* ============================= */}

          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* ============================= */}
          {/* Loading */}
          {/* ============================= */}

          {isLoading && (
            <Box
              sx={{
                py: 10,

                display:
                  "flex",

                justifyContent:
                  "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* ============================= */}
          {/* 申請なし */}
          {/* ============================= */}

          {!isLoading &&
            requests.length ===
              0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 6,

                  textAlign:
                    "center",

                  borderRadius:
                    2,

                  bgcolor:
                    "#ffffff",
                }}
              >
                <AdminPanelSettings
                  sx={{
                    mb: 1,

                    fontSize:
                      40,

                    color:
                      "text.disabled",
                  }}
                />

                <Typography
                  sx={{
                    fontWeight:
                      700,
                  }}
                >
                  現在、教員申請はありません
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,

                    color:
                      "text.secondary",

                    fontSize:
                      13,
                  }}
                >
                  新しい教員申請が行われると、
                  この画面に自動的に表示されます。
                </Typography>
              </Paper>
            )}

          {/* ============================= */}
          {/* 申請一覧 */}
          {/* ============================= */}

          {!isLoading &&
            requests.length >
              0 && (
              <Box
                sx={{
                  display:
                    "grid",

                  gap: 2,
                }}
              >
                {requests.map(
                  (
                    request,
                  ) => {
                    const isProcessing =
                      processingUserId ===
                      request.user_id;

                    return (
                      <Paper
                        key={
                          request.user_id
                        }
                        variant="outlined"
                        sx={{
                          p: 3,

                          borderRadius:
                            2,

                          bgcolor:
                            "#ffffff",
                        }}
                      >
                        <Box
                          sx={{
                            display:
                              "flex",

                            flexDirection:
                              {
                                xs:
                                  "column",

                                md:
                                  "row",
                              },

                            justifyContent:
                              "space-between",

                            alignItems:
                              {
                                xs:
                                  "stretch",

                                md:
                                  "center",
                              },

                            gap: 3,
                          }}
                        >
                          {/* ================= */}
                          {/* 申請内容 */}
                          {/* ================= */}

                          <Box>
                            <Typography
                              sx={{
                                fontSize:
                                  15,

                                fontWeight:
                                  700,

                                color:
                                  "#172e5a",
                              }}
                            >
                              教員登録申請
                            </Typography>

                            <Box
                              sx={{
                                mt: 1.5,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize:
                                    12,

                                  color:
                                    "text.secondary",
                                }}
                              >
                                Googleアカウント名
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.25,

                                  fontSize:
                                    18,

                                  fontWeight:
                                    700,

                                  color:
                                    "#172e5a",
                                }}
                              >
                                {
                                  request.display_name
                                }
                              </Typography>
                            </Box>

                            <Typography
                              sx={{
                                mt: 1.5,

                                color:
                                  "text.secondary",

                                fontSize:
                                  12,
                              }}
                            >
                              申請日時：
                              {formatDateTime(
                                request.requested_at,
                              )}
                            </Typography>
                          </Box>

                          {/* ================= */}
                          {/* Actions */}
                          {/* ================= */}

                          <Box
                            sx={{
                              display:
                                "flex",

                              gap: 1,

                              flexShrink:
                                0,
                            }}
                          >
                            <Button
                              variant="outlined"
                              startIcon={
                                <Close />
                              }
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                void handleReject(
                                  request.user_id,
                                );
                              }}
                              sx={{
                                color:
                                  "error.main",

                                borderColor:
                                  "error.main",

                                "&:hover": {
                                  borderColor:
                                    "error.dark",

                                  bgcolor:
                                    "rgba(211,47,47,0.04)",
                                },
                              }}
                            >
                              却下
                            </Button>

                            <Button
                              variant="contained"
                              startIcon={
                                !isProcessing
                                  ? (
                                    <Check />
                                  )
                                  : undefined
                              }
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                void handleApprove(
                                  request.user_id,
                                );
                              }}
                              sx={{
                                minWidth:
                                  100,

                                bgcolor:
                                  "#172e5a",

                                "&:hover":
                                  {
                                    bgcolor:
                                      "#102447",
                                  },
                              }}
                            >
                              {isProcessing ? (
                                <CircularProgress
                                  size={
                                    20
                                  }
                                  color="inherit"
                                />
                              ) : (
                                "承認"
                              )}
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    );
                  },
                )}
              </Box>
            )}

          {/* ============================= */}
          {/* 戻る */}
          {/* ============================= */}

          <Box
            sx={{
              mt: 4,
            }}
          >
            <Button
              onClick={() => {
                navigate(
                  "/events",
                );
              }}
              sx={{
                color:
                  "#172e5a",

                textTransform:
                  "none",
              }}
            >
              ← 発表会一覧へ戻る
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}