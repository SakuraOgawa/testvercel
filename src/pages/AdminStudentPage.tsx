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
  Check,
  Close,
  PersonAdd,
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

type StudentNumberRequest = {
  user_id: string;

  current_student_number:
    string | null;

  requested_student_number:
    string;

  requested_at:
    string | null;

  role: string;
};

/*
 * ========================================
 * Component
 * ========================================
 */

export default function AdminStudentPage() {
  const navigate =
    useNavigate();

  const [
    requests,
    setRequests,
  ] = useState<
    StudentNumberRequest[]
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
     * 最新の申請一覧を取得
     */
    const fetchRequests =
      async () => {
        const {
          data,
          error,
        } = await supabase.rpc(
          "get_student_number_requests",
        );

        /*
         * ページ破棄後なら
         * stateを更新しない
         */
        if (isCancelled) {
          return;
        }

        if (error) {
          setErrorMessage(
            "学籍番号申請を取得できませんでした。",
          );

          setIsLoading(
            false,
          );

          return;
        }

        setRequests(
          (data ?? []) as
            StudentNumberRequest[],
        );

        setErrorMessage("");

        setIsLoading(
          false,
        );
      };

    /*
     * 初回取得
     *
     * await後にstate更新するため
     * set-state-in-effect警告を回避
     */
    void fetchRequests();

    /*
     * ======================================
     * Supabase Realtime
     * ======================================
     */

    const channel =
      supabase
        .channel(
          "admin-student-number-requests",
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
             * profilesに変更が入ったら
             * 最新状態を再取得
             */
            void fetchRequests();
          },
        )
        .subscribe();

    /*
     * Cleanup
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
   * 手動再読み込み
   * ========================================
   */

  const handleRefresh =
    async () => {
      setIsLoading(true);

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_student_number_requests",
      );

      if (error) {
        setErrorMessage(
          "学籍番号申請を取得できませんでした。",
        );

        setIsLoading(false);

        return;
      }

      setRequests(
        (data ?? []) as
          StudentNumberRequest[],
      );

      setErrorMessage("");

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
        "approve_student_number_change",
        {
          p_user_id:
            userId,
        },
      );

      if (error) {
        setErrorMessage(
          error.message ||
            "学籍番号申請を承認できませんでした。",
        );

        setProcessingUserId(
          null,
        );

        return;
      }

      /*
       * requestsは直接変更しない。
       *
       * RPC
       * ↓
       * profiles UPDATE
       * ↓
       * Realtime
       * ↓
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
        "reject_student_number_change",
        {
          p_user_id:
            userId,
        },
      );

      if (error) {
        setErrorMessage(
          error.message ||
            "学籍番号申請を却下できませんでした。",
        );

        setProcessingUserId(
          null,
        );

        return;
      }

      /*
       * Realtimeで一覧が更新される
       */
      setProcessingUserId(
        null,
      );
    };

  /*
   * ========================================
   * 日付
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

              display: "flex",

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
                <PersonAdd
                  sx={{
                    color:
                      "#172e5a",

                    fontSize: 30,
                  }}
                />

                <Typography
                  component="h1"
                  sx={{
                    fontSize: 24,

                    fontWeight:
                      700,

                    color:
                      "#172e5a",
                  }}
                >
                  学籍番号申請管理
                </Typography>
              </Box>

              <Typography
                sx={{
                  mt: 1,

                  color:
                    "text.secondary",

                  fontSize: 13,
                }}
              >
                学生から申請された学籍番号を確認し、
                承認または却下します。
              </Typography>
            </Box>

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
                flexShrink: 0,

                color:
                  "#172e5a",

                borderColor:
                  "#172e5a",

                textTransform:
                  "none",
              }}
            >
              更新
            </Button>
          </Box>

          {/* ============================= */}
          {/* Realtime表示 */}
          {/* ============================= */}

          <Alert
            severity="info"
            sx={{
              mb: 3,
            }}
          >
            申請一覧はリアルタイムで更新されます。
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
          {/* Empty */}
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
                <PersonAdd
                  sx={{
                    mb: 1,

                    fontSize: 40,

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
                  現在、申請はありません
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,

                    color:
                      "text.secondary",

                    fontSize: 13,
                  }}
                >
                  新しい申請が行われると、
                  この画面に自動的に表示されます。
                </Typography>
              </Paper>
            )}

          {/* ============================= */}
          {/* Request List */}
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

                    const isNewRegistration =
                      !request.current_student_number;

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
                              {isNewRegistration
                                ? "学生登録申請"
                                : "学籍番号変更申請"}
                            </Typography>

                            {!isNewRegistration && (
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
                                  現在の学籍番号
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: 0.25,

                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    request.current_student_number
                                  }
                                </Typography>
                              </Box>
                            )}

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
                                {isNewRegistration
                                  ? "申請された学籍番号"
                                  : "変更後の学籍番号"}
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
                                  request.requested_student_number
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
          {/* Back */}
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