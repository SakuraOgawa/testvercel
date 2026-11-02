import { useState } from "react";

import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  Button,
  Typography,
} from "@mui/material";

import {
  AdminPanelSettings,
  Close,
  Menu,
  AssignmentInd,
  Home,
  HowToReg,
  Logout,
  People,
  PendingActions,
  School,
  Settings,
  Summarize,
} from "@mui/icons-material";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAuthContext,
} from "../hooks/useAuthContext";

/*
 * ========================================
 * Sidebar幅
 * ========================================
 */

export const drawerWidth =
  256;

/*
 * ========================================
 * Component
 * ========================================
 */

export default function Sidebar() {
  const {
    session,
    profile,
    logout,
  } = useAuthContext();

  const navigate =
    useNavigate();

  const location =
    useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const goTo = (path: string) => { setMobileOpen(false); navigate(path); };


  /*
   * ========================================
   * Event
   * ========================================
   */

  const {
    eventId,
  } = useParams<{
    eventId: string;
  }>();

  const hasSelectedEvent =
    Boolean(eventId);

  /*
   * ========================================
   * Context読み込み前
   * ========================================
   */

  if (!session || !profile) {
    return null;
  }

  /*
   * ========================================
   * Role表示
   * ========================================
   */

  const getRoleLabel = () => {
    switch (profile.role) {
      case "pending":
        return "未登録";

      case "student_pending":
        return "学生登録申請中";

      case "student":
        return "学生";

      case "teacher_pending":
        return "教員申請中";

      case "teacher":
        return "教員";

      case "admin":
        return "管理者";

      default:
        return "";
    }
  };

  const roleLabel =
    getRoleLabel();

  /*
   * ========================================
   * Googleユーザー情報
   * ========================================
   */

  const userName =
    session.user.user_metadata
      ?.full_name ??
    session.user.user_metadata
      ?.name ??
    "ユーザー";

  const avatarUrl =
    session.user.user_metadata
      ?.avatar_url ??
    session.user.user_metadata
      ?.picture ??
    undefined;

  /*
   * ========================================
   * Active判定
   * ========================================
   */

  const isActive = (
    path: string,
  ) => {
    return (
      location.pathname ===
      path
    );
  };

  /*
   * ========================================
   * Menu style
   * ========================================
   */

  const menuButtonStyle = (
    active: boolean,
  ) => ({
    height: 44,

    px: 1.5,

    justifyContent:
      "flex-start",

    gap: 2,

    color: "#ffffff",

    fontSize: 13,

    fontWeight: 700,

    textTransform:
      "none",

    borderRadius: 1,

    bgcolor: active
      ? "rgba(255,255,255,0.14)"
      : "transparent",

    "& .MuiButton-startIcon":
      {
        mr: 0,
      },

    "&:hover": {
      bgcolor:
        "rgba(255,255,255,0.1)",
    },
  });

  /*
   * ========================================
   * Logout
   * ========================================
   */

  const handleLogout =
    async () => {
      try {
        await logout();
      } catch {
        /*
         * ログアウト失敗時は
         * 現在画面を維持
         */
      }
    };

  /*
   * ========================================
   * JSX
   * ========================================
   */

  const mobileContent = (
    <Box sx={{ width: drawerWidth, height: "100%", display: "flex", flexDirection: "column", color: "#fff", bgcolor: "#172e5a", pt: 2 }}>
      <Box sx={{ px: 2.5, pb: 2, display: "flex", alignItems: "center", gap: 1.5 }}><School sx={{ fontSize: 30 }} /><Typography sx={{ fontSize: 16, fontWeight: 700 }}>卒業発表管理システム</Typography><IconButton aria-label="メニューを閉じる" onClick={() => setMobileOpen(false)} sx={{ ml: "auto", color: "#fff" }}><Close /></IconButton></Box>
      <Box component="nav" sx={{ px: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Button fullWidth startIcon={<Home />} onClick={() => goTo("/events")} sx={menuButtonStyle(isActive("/events"))}>ホーム</Button>
        {profile.role === "pending" && <Button fullWidth startIcon={<AssignmentInd />} onClick={() => goTo("/register")} sx={menuButtonStyle(location.pathname.startsWith("/register"))}>利用者登録</Button>}
        {profile.role === "student_pending" && <Button fullWidth startIcon={<PendingActions />} onClick={() => goTo("/register/student")} sx={menuButtonStyle(isActive("/register/student"))}>学生登録申請状況</Button>}
        {profile.role === "teacher_pending" && <Button fullWidth startIcon={<PendingActions />} onClick={() => goTo("/register/teacher")} sx={menuButtonStyle(isActive("/register/teacher"))}>教員申請状況</Button>}
        {profile.role === "admin" && <><Button fullWidth startIcon={<HowToReg />} onClick={() => goTo("/admin/students")} sx={menuButtonStyle(isActive("/admin/students"))}>学籍番号申請管理</Button><Button fullWidth startIcon={<AdminPanelSettings />} onClick={() => goTo("/admin/teachers")} sx={menuButtonStyle(isActive("/admin/teachers"))}>教員申請管理</Button></>}
        {hasSelectedEvent && <><Typography sx={{ mt: 2, px: 1.5, color: "rgba(255,255,255,.55)", fontSize: 10, fontWeight: 700 }}>発表会</Typography><Button fullWidth startIcon={<Summarize />} onClick={() => goTo(`/events/${eventId}/presentations`)} sx={menuButtonStyle(location.pathname.startsWith(`/events/${eventId}/presentations`))}>発表一覧</Button><Button fullWidth startIcon={<Summarize />} onClick={() => goTo(`/events/${eventId}/program`)} sx={menuButtonStyle(location.pathname === `/events/${eventId}/program`)}>発表プログラム</Button><Button fullWidth startIcon={<People />} onClick={() => goTo(`/events/${eventId}/students`)} sx={menuButtonStyle(location.pathname.startsWith(`/events/${eventId}/students`))}>学生一覧</Button></>}
        <Button fullWidth startIcon={<Settings />} onClick={() => goTo("/settings")} sx={menuButtonStyle(isActive("/settings"))}>設定</Button>
      </Box>
      <Box sx={{ mt: "auto", p: 2.5 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><Avatar src={avatarUrl} alt={userName} sx={{ width: 42, height: 42, bgcolor: "#6f92db" }}>{userName.slice(0, 1)}</Avatar><Box><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{userName}</Typography><Typography sx={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>{roleLabel}</Typography></Box></Box><Button fullWidth startIcon={<Logout />} onClick={() => void handleLogout()} sx={{ mt: 2, justifyContent: "flex-start", color: "#fff" }}>ログアウト</Button></Box>
    </Box>
  );

  return (
    <>
    <Box sx={{ display: { xs: "flex", md: "none" }, position: "fixed", top: 8, left: 8, zIndex: 1200 }}><IconButton aria-label="メニューを開く" onClick={() => setMobileOpen(true)} sx={{ bgcolor: "#172e5a", color: "#fff", boxShadow: 2, "&:hover": { bgcolor: "#233e70" } }}><Menu /></IconButton></Box>
    <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "#172e5a" } }}>{mobileContent}</Drawer>
    <Box
      component="aside"
      sx={{
        position: "fixed",

        top: 0,
        bottom: 0,
        left: 0,

        width:
          drawerWidth,

        display: {
          xs: "none",
          md: "flex",
        },

        flexDirection:
          "column",

        color:
          "#ffffff",

        bgcolor:
          "#172e5a",

        zIndex: 10,
      }}
    >
      {/* ================================= */}
      {/* システム名 */}
      {/* ================================= */}

      <Box
        sx={{
          height: 88,

          px: 2.5,

          display:
            "flex",

          alignItems:
            "center",

          gap: 1.5,

          flexShrink: 0,
        }}
      >
        <School
          sx={{
            fontSize: 34,
          }}
        />

        <Typography
          sx={{
            fontSize: 18,

            fontWeight:
              700,

            whiteSpace:
              "nowrap",
          }}
        >
          卒業発表管理システム
        </Typography>
      </Box>

      {/* ================================= */}
      {/* Menu */}
      {/* ================================= */}

      <Box
        component="nav"
        sx={{
          px: 1.5,

          display:
            "flex",

          flexDirection:
            "column",

          gap: 0.5,
        }}
      >
        {/* =============================== */}
        {/* ホーム */}
        {/* =============================== */}

        <Button
          fullWidth
          startIcon={
            <Home />
          }
          onClick={() => {
            goTo(
              "/events",
            );
          }}
          sx={menuButtonStyle(
            isActive(
              "/events",
            ),
          )}
        >
          ホーム
        </Button>

        {/* =============================== */}
        {/* pending */}
        {/* =============================== */}

        {profile.role ===
          "pending" && (
          <Button
            fullWidth
            startIcon={
              <AssignmentInd />
            }
            onClick={() => {
              goTo(
                "/register",
              );
            }}
            sx={menuButtonStyle(
              location.pathname.startsWith(
                "/register",
              ),
            )}
          >
            利用者登録
          </Button>
        )}

        {/* =============================== */}
        {/* student_pending */}
        {/* =============================== */}

        {profile.role ===
          "student_pending" && (
          <Button
            fullWidth
            startIcon={
              <PendingActions />
            }
            onClick={() => {
              goTo(
                "/register/student",
              );
            }}
            sx={menuButtonStyle(
              isActive(
                "/register/student",
              ),
            )}
          >
            学生登録申請状況
          </Button>
        )}

        {/* =============================== */}
        {/* teacher_pending */}
        {/* =============================== */}

        {profile.role ===
          "teacher_pending" && (
          <Button
            fullWidth
            startIcon={
              <PendingActions />
            }
            onClick={() => {
              goTo(
                "/register/teacher",
              );
            }}
            sx={menuButtonStyle(
              isActive(
                "/register/teacher",
              ),
            )}
          >
            教員申請状況
          </Button>
        )}

        {/* =============================== */}
        {/* 管理者 */}
        {/* =============================== */}

        {profile.role ===
          "admin" && (
          <>

            {/* 学籍番号申請管理 */}

            <Button
              fullWidth
              startIcon={
                <HowToReg />
              }
              onClick={() => {
                goTo(
                  "/admin/students",
                );
              }}
              sx={menuButtonStyle(
                isActive(
                  "/admin/students",
                ),
              )}
            >
              学籍番号申請管理
            </Button>

            {/* 教員申請管理 */}

            <Button
              fullWidth
              startIcon={
                <AdminPanelSettings />
              }
              onClick={() => {
                goTo(
                  "/admin/teachers",
                );
              }}
              sx={menuButtonStyle(
                isActive(
                  "/admin/teachers",
                ),
              )}
            >
              教員申請管理
            </Button>
          </>
        )}

        {/* =============================== */}
        {/* 発表会選択後 */}
        {/* =============================== */}

        {hasSelectedEvent && (
          <>
            <Box
              sx={{
                mt: 2,
                mb: 0.5,
                px: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,

                  fontWeight:
                    700,

                  color:
                    "rgba(255,255,255,0.5)",

                  letterSpacing:
                    1,
                }}
              >
                発表会
              </Typography>
            </Box>

            {/* 発表一覧 */}

            <Button
              fullWidth
              startIcon={
                <Summarize />
              }
              onClick={() => {
                goTo(
                  `/events/${eventId}/presentations`,
                );
              }}
              sx={menuButtonStyle(
                location.pathname.startsWith(
                  `/events/${eventId}/presentations`,
                ),
              )}
            >
              発表一覧
            </Button>

            <Button
              fullWidth
              startIcon={<Summarize />}
              onClick={() => goTo(`/events/${eventId}/program`)}
              sx={menuButtonStyle(location.pathname === `/events/${eventId}/program`)}
            >
              発表プログラム
            </Button>

            {/* 学生一覧 */}

            <Button
              fullWidth
              startIcon={
                <People />
              }
              onClick={() => {
                goTo(
                  `/events/${eventId}/students`,
                );
              }}
              sx={menuButtonStyle(
                location.pathname.startsWith(
                  `/events/${eventId}/students`,
                ),
              )}
            >
              学生一覧
            </Button>
          </>
        )}

        {/* =============================== */}
        {/* 設定 */}
        {/* =============================== */}

          <Button
            fullWidth
            startIcon={
              <Settings />
            }
            onClick={() => {
              goTo(
                "/settings",
              );
            }}
            sx={menuButtonStyle(
              isActive(
                "/settings",
              ),
            )}
          >
            設定
          </Button>
        </Box>

      {/* ================================= */}
      {/* User */}
      {/* ================================= */}

      <Box
        sx={{
          mt: "auto",

          px: 2.5,

          pb: 3,
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
          <Avatar
            src={avatarUrl}
            alt={userName}
            sx={{
              width: 45,

              height: 45,

              bgcolor:
                "#6f92db",

              border:
                "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {userName.slice(
              0,
              1,
            )}
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                maxWidth:
                  145,

                fontSize:
                  11,

                fontWeight:
                  700,
              }}
            >
              {userName}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,

                fontSize: 12,

                color:
                  "rgba(255,255,255,0.65)",
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        {/* =============================== */}
        {/* Logout */}
        {/* =============================== */}

        <Button
          fullWidth
          startIcon={
            <Logout />
          }
          onClick={() => {
            void handleLogout();
          }}
          sx={{
            mt: 2,

            px: 1,

            justifyContent:
              "flex-start",

            color:
              "#ffffff",

            fontSize: 12,

            fontWeight:
              700,

            textTransform:
              "none",

            "&:hover": {
              bgcolor:
                "rgba(255,255,255,0.1)",
            },
          }}
        >
          ログアウト
        </Button>
      </Box>
    </Box>
    </>
  );
}