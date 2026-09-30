import {
  useState,
  type ReactNode,
} from "react";

import {
  AccountCircle,
  Badge,
  Edit,
  Logout,
  ManageAccounts,
  PersonAdd,
  School,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import {
  useAuthContext,
} from "../hooks/useAuthContext";

import {
  supabase,
} from "../lib/supabase";

/*
 * ========================================
 * SettingsPage
 * ========================================
 */

export default function SettingsPage() {
  const navigate =
    useNavigate();

  const {
    session,
    profile,
  } = useAuthContext();

  /*
   * ========================================
   * 学籍番号変更
   * ========================================
   */

  const [
    isStudentNumberDialogOpen,
    setIsStudentNumberDialogOpen,
  ] = useState(false);

  const [
    newStudentNumber,
    setNewStudentNumber,
  ] = useState("");

  const [
    isRequestingStudentNumber,
    setIsRequestingStudentNumber,
  ] = useState(false);

  const [
    studentNumberError,
    setStudentNumberError,
  ] = useState("");

  /*
   * ========================================
   * 学生登録申請取り下げ
   * ========================================
   */

  const [
    isCancellingStudentRegistration,
    setIsCancellingStudentRegistration,
  ] = useState(false);

  const [
    studentRegistrationError,
    setStudentRegistrationError,
  ] = useState("");

  /*
   * ========================================
   * 学籍番号変更申請取り下げ
   * ========================================
   */

  const [
    isCancellingStudentNumberChange,
    setIsCancellingStudentNumberChange,
  ] = useState(false);

  /*
   * ========================================
   * 教員申請取り下げ
   * ========================================
   */

  const [
    isCancellingTeacherRegistration,
    setIsCancellingTeacherRegistration,
  ] = useState(false);

  const [
    teacherRegistrationError,
    setTeacherRegistrationError,
  ] = useState("");

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

  if (!profile) {
    return null;
  }

  /*
   * ========================================
   * Google表示名
   * ========================================
   */

  const displayName =
    session.user.user_metadata?.full_name ??
    session.user.user_metadata?.name ??
    "ユーザー";

  /*
   * ========================================
   * 学生登録申請取り下げ
   * ========================================
   */

  const handleCancelStudentRegistration =
    async () => {
      const shouldCancel =
        window.confirm(
          "学生登録申請を取り下げますか？\n\n取り下げ後は未登録状態に戻ります。",
        );

      if (!shouldCancel) {
        return;
      }

      setStudentRegistrationError("");

      try {
        setIsCancellingStudentRegistration(
          true,
        );

        const {
          error,
        } = await supabase.rpc(
          "cancel_student_registration",
        );

        if (error) {
          setStudentRegistrationError(
            error.message ||
              "学生登録申請を取り下げることができませんでした。",
          );
        }
      } catch {
        setStudentRegistrationError(
          "学生登録申請を取り下げることができませんでした。",
        );
      } finally {
        setIsCancellingStudentRegistration(
          false,
        );
      }
    };

  /*
   * ========================================
   * 学籍番号変更申請
   * ========================================
   */

  const handleRequestStudentNumberChange =
    async () => {
      const normalized =
        newStudentNumber
          .trim()
          .toUpperCase();

      setStudentNumberError("");

      if (!normalized) {
        setStudentNumberError(
          "新しい学籍番号を入力してください。",
        );

        return;
      }

      if (
        normalized ===
        profile.student_number
      ) {
        setStudentNumberError(
          "現在と同じ学籍番号です。",
        );

        return;
      }

      try {
        setIsRequestingStudentNumber(
          true,
        );

        const {
          error,
        } = await supabase.rpc(
          "request_student_number_change",
          {
            p_student_number:
              normalized,
          },
        );

        if (error) {
          setStudentNumberError(
            error.message ||
              "学籍番号の変更を申請できませんでした。",
          );

          return;
        }

        setNewStudentNumber(
          "",
        );

        setIsStudentNumberDialogOpen(
          false,
        );

        /*
         * profiles UPDATE
         * ↓
         * Realtime
         * ↓
         * useProfile()
         *
         * で自動更新される。
         */
      } catch {
        setStudentNumberError(
          "学籍番号の変更を申請できませんでした。",
        );
      } finally {
        setIsRequestingStudentNumber(
          false,
        );
      }
    };

  /*
   * ========================================
   * 学籍番号変更申請取り下げ
   * ========================================
   */

  const handleCancelStudentNumberChange =
    async () => {
      const shouldCancel =
        window.confirm(
          "学籍番号の変更申請を取り下げますか？",
        );

      if (!shouldCancel) {
        return;
      }

      setStudentNumberError("");

      try {
        setIsCancellingStudentNumberChange(
          true,
        );

        const {
          error,
        } = await supabase.rpc(
          "cancel_student_number_change",
        );

        if (error) {
          setStudentNumberError(
            error.message ||
              "学籍番号の変更申請を取り下げることができませんでした。",
          );
        }
      } catch {
        setStudentNumberError(
          "学籍番号の変更申請を取り下げることができませんでした。",
        );
      } finally {
        setIsCancellingStudentNumberChange(
          false,
        );
      }
    };

  /*
   * ========================================
   * 教員申請取り下げ
   * ========================================
   */

  const handleCancelTeacherRegistration =
    async () => {
      const shouldCancel =
        window.confirm(
          "教員登録申請を取り下げますか？\n\n取り下げ後は未登録状態に戻ります。",
        );

      if (!shouldCancel) {
        return;
      }

      setTeacherRegistrationError("");

      try {
        setIsCancellingTeacherRegistration(
          true,
        );

        const {
          error,
        } = await supabase.rpc(
          "cancel_teacher_registration",
        );

        if (error) {
          setTeacherRegistrationError(
            error.message ||
              "教員登録申請を取り下げることができませんでした。",
          );
        }
      } catch {
        setTeacherRegistrationError(
          "教員登録申請を取り下げることができませんでした。",
        );
      } finally {
        setIsCancellingTeacherRegistration(
          false,
        );
      }
    };

  /*
   * ========================================
   * Logout
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
      }
    };

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
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          minHeight:
            "100vh",

          ml: {
            xs: 0,
            md: `${drawerWidth}px`,
          },

          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },

          py: 4,
        }}
      >
        <Box
          sx={{
            width:
              "100%",

            maxWidth:
              900,
          }}
        >
          {/* ============================= */}
          {/* Header */}
          {/* ============================= */}

          <Box
            sx={{
              mb: 4,
            }}
          >
            <Box
              sx={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: 1.5,
              }}
            >
              <ManageAccounts
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
                  color:
                    "#172e5a",

                  fontSize:
                    24,

                  fontWeight:
                    700,
                }}
              >
                設定
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
              アカウント情報や利用者情報を確認できます。
            </Typography>
          </Box>

          {/* ============================= */}
          {/* アカウント情報 */}
          {/* ============================= */}

          <SettingsSection
            title="アカウント情報"
            icon={
              <AccountCircle />
            }
          >
            <SettingRow
              label="Googleアカウント"
              value={
                displayName
              }
            />

            <Divider />

            <SettingRow
              label="利用者区分"
              value={
                <Chip
                  label={getRoleLabel(
                    profile.role,
                  )}
                  size="small"
                  sx={{
                    bgcolor:
                      getRoleBackgroundColor(
                        profile.role,
                      ),

                    color:
                      getRoleTextColor(
                        profile.role,
                      ),

                    fontWeight:
                      700,
                  }}
                />
              }
            />
          </SettingsSection>

          {/* ============================= */}
          {/* pending */}
          {/* ============================= */}

          {profile.role ===
            "pending" && (
            <SettingsSection
              title="利用者登録"
              icon={
                <PersonAdd />
              }
            >
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                }}
              >
                現在、学生または教員としての登録は行われていません。
                登録しなくても発表情報の閲覧はできます。
              </Alert>

              <Box
                sx={{
                  display:
                    "flex",

                  flexDirection: {
                    xs:
                      "column",

                    sm:
                      "row",
                  },

                  gap: 1.5,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={
                    <Badge />
                  }
                  onClick={() =>
                    navigate(
                      "/register/student",
                    )
                  }
                  sx={{
                    bgcolor:
                      "#172e5a",

                    fontWeight:
                      700,

                    "&:hover":
                      {
                        bgcolor:
                          "#102447",
                      },
                  }}
                >
                  学生として登録
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <School />
                  }
                  onClick={() =>
                    navigate(
                      "/register/teacher",
                    )
                  }
                  sx={{
                    color:
                      "#172e5a",

                    borderColor:
                      "#172e5a",

                    fontWeight:
                      700,
                  }}
                >
                  教員として申請
                </Button>
              </Box>
            </SettingsSection>
          )}

          {/* ============================= */}
          {/* student_pending */}
          {/* ============================= */}

          {profile.role ===
            "student_pending" && (
            <SettingsSection
              title="学生情報"
              icon={
                <Badge />
              }
            >
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                }}
              >
                学生登録を申請中です。
                管理者による承認をお待ちください。
              </Alert>

              {studentRegistrationError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                  }}
                >
                  {
                    studentRegistrationError
                  }
                </Alert>
              )}

              <SettingRow
                label="申請中の学籍番号"
                value={
                  profile.requested_student_number ??
                  "不明"
                }
              />

              <Divider />

              <SettingRow
                label="申請日時"
                value={formatDateTime(
                  profile.student_number_requested_at,
                )}
              />

              <Divider />

              <Box
                sx={{
                  pt: 3,
                }}
              >
                <Typography
                  sx={{
                    mb: 2,

                    color:
                      "text.secondary",

                    fontSize:
                      13,

                    lineHeight:
                      1.7,
                  }}
                >
                  申請を取り下げると、利用者区分は未登録に戻ります。
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  disabled={
                    isCancellingStudentRegistration
                  }
                  onClick={() => {
                    void handleCancelStudentRegistration();
                  }}
                  sx={{
                    fontWeight:
                      700,
                  }}
                >
                  {isCancellingStudentRegistration
                    ? "取り下げ中..."
                    : "学生登録申請を取り下げる"}
                </Button>
              </Box>
            </SettingsSection>
          )}

          {/* ============================= */}
          {/* student */}
          {/* ============================= */}

          {profile.role ===
            "student" && (
            <SettingsSection
              title="学生情報"
              icon={
                <Badge />
              }
            >
              {studentNumberError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                  }}
                >
                  {
                    studentNumberError
                  }
                </Alert>
              )}

              <SettingRow
                label="現在の学籍番号"
                value={
                  profile.student_number ??
                  "未登録"
                }
              />

              {profile.requested_student_number ? (
                <>
                  <Divider />

                  <SettingRow
                    label="変更申請中の学籍番号"
                    value={
                      profile.requested_student_number
                    }
                  />

                  <Divider />

                  <SettingRow
                    label="申請日時"
                    value={formatDateTime(
                      profile.student_number_requested_at,
                    )}
                  />

                  <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                    }}
                  >
                    学籍番号の変更を申請中です。
                    現在の学籍番号は、管理者が承認するまで変更されません。
                  </Alert>

                  <Box
                    sx={{
                      mt: 3,
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={
                        isCancellingStudentNumberChange
                      }
                      onClick={() => {
                        void handleCancelStudentNumberChange();
                      }}
                      sx={{
                        fontWeight:
                          700,
                      }}
                    >
                      {isCancellingStudentNumberChange
                        ? "取り下げ中..."
                        : "変更申請を取り下げる"}
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Divider />

                  <Box
                    sx={{
                      pt: 3,
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 2,

                        color:
                          "text.secondary",

                        fontSize:
                          13,

                        lineHeight:
                          1.7,
                      }}
                    >
                      学籍番号に変更がある場合は、
                      管理者へ変更申請を行います。
                    </Typography>

                    <Button
                      variant="outlined"
                      startIcon={
                        <Edit />
                      }
                      onClick={() => {
                        setStudentNumberError(
                          "",
                        );

                        setNewStudentNumber(
                          "",
                        );

                        setIsStudentNumberDialogOpen(
                          true,
                        );
                      }}
                      sx={{
                        color:
                          "#172e5a",

                        borderColor:
                          "#172e5a",

                        fontWeight:
                          700,
                      }}
                    >
                      学籍番号を変更
                    </Button>
                  </Box>
                </>
              )}
            </SettingsSection>
          )}

          {/* ============================= */}
          {/* teacher_pending */}
          {/* ============================= */}

          {profile.role ===
            "teacher_pending" && (
            <SettingsSection
              title="教員情報"
              icon={
                <School />
              }
            >
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                }}
              >
                教員登録を申請中です。
                管理者による承認をお待ちください。
              </Alert>

              {teacherRegistrationError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                  }}
                >
                  {
                    teacherRegistrationError
                  }
                </Alert>
              )}

              <SettingRow
                label="申請状態"
                value="教員登録申請中"
              />

              <Divider />

              <SettingRow
                label="申請日時"
                value={formatDateTime(
                  profile.teacher_requested_at,
                )}
              />

              <Divider />

              <Box
                sx={{
                  pt: 3,
                }}
              >
                <Typography
                  sx={{
                    mb: 2,

                    color:
                      "text.secondary",

                    fontSize:
                      13,

                    lineHeight:
                      1.7,
                  }}
                >
                  申請を取り下げると、利用者区分は未登録に戻ります。
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  disabled={
                    isCancellingTeacherRegistration
                  }
                  onClick={() => {
                    void handleCancelTeacherRegistration();
                  }}
                  sx={{
                    fontWeight:
                      700,
                  }}
                >
                  {isCancellingTeacherRegistration
                    ? "取り下げ中..."
                    : "教員登録申請を取り下げる"}
                </Button>
              </Box>
            </SettingsSection>
          )}

          {/* ============================= */}
          {/* teacher */}
          {/* ============================= */}

          {profile.role ===
            "teacher" && (
            <SettingsSection
              title="教員情報"
              icon={
                <School />
              }
            >
              <SettingRow
                label="登録状態"
                value="教員として登録済み"
              />

              <Alert
                severity="success"
                sx={{
                  mt: 3,
                }}
              >
                教員として発表情報の登録や発表会の作成ができます。
              </Alert>
            </SettingsSection>
          )}

          {/* ============================= */}
          {/* admin */}
          {/* ============================= */}

          {profile.role ===
            "admin" && (
            <SettingsSection
              title="管理者情報"
              icon={
                <ManageAccounts />
              }
            >
              <SettingRow
                label="登録状態"
                value="管理者"
              />

              <Alert
                severity="info"
                sx={{
                  mt: 3,
                }}
              >
                学籍番号申請および教員登録申請を管理できます。
              </Alert>
            </SettingsSection>
          )}

          {/* ============================= */}
          {/* Account */}
          {/* ============================= */}

          <SettingsSection
            title="アカウント"
            icon={
              <AccountCircle />
            }
          >
            <Typography
              sx={{
                mb: 2,

                color:
                  "text.secondary",

                fontSize:
                  13,

                lineHeight:
                  1.7,
              }}
            >
              現在ログインしているGoogleアカウントからログアウトします。
            </Typography>

            <Button
              variant="outlined"
              startIcon={
                <Logout />
              }
              onClick={() => {
                void handleLogout();
              }}
              sx={{
                color:
                  "error.main",

                borderColor:
                  "error.main",

                fontWeight:
                  700,
              }}
            >
              ログアウト
            </Button>
          </SettingsSection>
        </Box>
      </Box>

      {/* ================================= */}
      {/* 学籍番号変更Dialog */}
      {/* ================================= */}

      <Dialog
        open={
          isStudentNumberDialogOpen
        }
        onClose={() => {
          if (
            !isRequestingStudentNumber
          ) {
            setIsStudentNumberDialogOpen(
              false,
            );
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            color:
              "#172e5a",

            fontWeight:
              700,
          }}
        >
          学籍番号変更申請
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 3,

              color:
                "text.secondary",

              fontSize:
                13,

              lineHeight:
                1.7,
            }}
          >
            現在の学籍番号は
            「
            {profile.student_number ??
              "未登録"}
            」です。
            新しい学籍番号は管理者による承認後に反映されます。
          </Typography>

          {studentNumberError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
              }}
            >
              {
                studentNumberError
              }
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            label="新しい学籍番号"
            value={
              newStudentNumber
            }
            disabled={
              isRequestingStudentNumber
            }
            onChange={(event) => {
              setNewStudentNumber(
                event.target.value.toUpperCase(),
              );

              setStudentNumberError(
                "",
              );
            }}
            placeholder="例：G24999"
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            disabled={
              isRequestingStudentNumber
            }
            onClick={() => {
              setIsStudentNumberDialogOpen(
                false,
              );

              setStudentNumberError(
                "",
              );
            }}
          >
            キャンセル
          </Button>

          <Button
            variant="contained"
            disabled={
              isRequestingStudentNumber ||
              !newStudentNumber.trim()
            }
            onClick={() => {
              void handleRequestStudentNumberChange();
            }}
            sx={{
              minWidth:
                110,

              bgcolor:
                "#172e5a",

              fontWeight:
                700,

              "&:hover":
                {
                  bgcolor:
                    "#102447",
                },
            }}
          >
            {isRequestingStudentNumber ? (
              <CircularProgress
                size={20}
                color="inherit"
              />
            ) : (
              "変更を申請"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/*
 * ==========================================
 * SettingsSection
 * ==========================================
 */

type SettingsSectionProps = {
  title:
    string;

  icon:
    ReactNode;

  children:
    ReactNode;
};

function SettingsSection({
  title,
  icon,
  children,
}: SettingsSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,

        border:
          "1px solid #e0e0e0",

        borderRadius:
          2,

        bgcolor:
          "#ffffff",

        overflow:
          "hidden",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },

          py: 2,

          display:
            "flex",

          alignItems:
            "center",

          gap: 1,

          bgcolor:
            "#fafafa",

          borderBottom:
            "1px solid #eeeeee",

          color:
            "#172e5a",
        }}
      >
        {icon}

        <Typography
          sx={{
            fontSize:
              15,

            fontWeight:
              700,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

/*
 * ==========================================
 * SettingRow
 * ==========================================
 */

type SettingRowProps = {
  label:
    string;

  value:
    ReactNode;
};

function SettingRow({
  label,
  value,
}: SettingRowProps) {
  return (
    <Box
      sx={{
        py: 2,

        display:
          "grid",

        gridTemplateColumns:
          {
            xs:
              "1fr",

            sm:
              "220px 1fr",
          },

        gap: {
          xs: 0.75,
          sm: 2,
        },

        alignItems:
          "center",
      }}
    >
      <Typography
        sx={{
          color:
            "text.secondary",

          fontSize:
            13,

          fontWeight:
            700,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          minWidth:
            0,

          color:
            "#333333",

          fontSize:
            14,

          fontWeight:
            600,

          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </Box>
    </Box>
  );
}

/*
 * ==========================================
 * Role
 * ==========================================
 */

function getRoleLabel(
  role: string,
) {
  switch (role) {
    case "pending":
      return "未登録";

    case "student_pending":
      return "学生申請中";

    case "student":
      return "学生";

    case "teacher_pending":
      return "教員申請中";

    case "teacher":
      return "教員";

    case "admin":
      return "管理者";

    default:
      return "不明";
  }
}

function getRoleBackgroundColor(
  role: string,
) {
  switch (role) {
    case "student":
      return "#e8f5e9";

    case "teacher":
      return "#e3f2fd";

    case "admin":
      return "#f3e5f5";

    case "student_pending":
    case "teacher_pending":
      return "#fff3e0";

    default:
      return "#eeeeee";
  }
}

function getRoleTextColor(
  role: string,
) {
  switch (role) {
    case "student":
      return "#2e7d32";

    case "teacher":
      return "#1565c0";

    case "admin":
      return "#7b1fa2";

    case "student_pending":
    case "teacher_pending":
      return "#e65100";

    default:
      return "#555555";
  }
}

/*
 * ==========================================
 * Date
 * ==========================================
 */

function formatDateTime(
  value:
    | string
    | null,
) {
  if (!value) {
    return "不明";
  }

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  ).format(
    new Date(value),
  );
}