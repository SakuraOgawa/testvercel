import {
  Box,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  useAuthContext,
} from "./hooks/useAuthContext";

import {
  theme,
} from "./theme/theme";

/*
 * ========================================
 * Components
 * ========================================
 */

import LoginPage from "./components/LoginPage";

/*
 * ========================================
 * Pages
 * ========================================
 */

import EventListPage from "./pages/EventListPage";

import EventCreatePage from "./pages/EventCreatePage";

import PresentationListPage from "./pages/PresentationListPage";

import PresentationCreatePage from "./pages/PresentationCreatePage";

import PresentationConfirmPage from "./pages/PresentationConfirmPage";

import StudentListPage from "./pages/StudentListPage";

import RegisterPage from "./pages/RegisterPage";

import StudentRegisterPage from "./pages/StudentRegisterPage";

import TeacherRegisterPage from "./pages/TeacherRegisterPage";

import AdminStudentPage from "./pages/AdminStudentPage";

import AdminTeacherPage from "./pages/AdminTeacherPage";

import SettingsPage from "./pages/SettingsPage";

/*
 * ========================================
 * App
 * ========================================
 */

export default function App() {
  /*
   * ========================================
   * AuthContext
   * ========================================
   */

  const {
    session,
    profile,
    isAuthLoading,
    isProfileLoading,
    profileError,
  } = useAuthContext();

  /*
   * ========================================
   * 認証情報読み込み中
   * ========================================
   */

  if (isAuthLoading) {
    return (
      <ThemeProvider
        theme={theme}
      >
        <CssBaseline />

        <Box
          sx={{
            minHeight:
              "100vh",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            bgcolor:
              "#f7f8fa",
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  /*
   * ========================================
   * 未ログイン
   * ========================================
   */

  if (!session) {
    return (
      <ThemeProvider
        theme={theme}
      >
        <CssBaseline />

        <LoginPage />
      </ThemeProvider>
    );
  }

  /*
   * ========================================
   * Profile読み込み中
   * ========================================
   */

  if (isProfileLoading) {
    return (
      <ThemeProvider
        theme={theme}
      >
        <CssBaseline />

        <Box
          sx={{
            minHeight:
              "100vh",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            bgcolor:
              "#f7f8fa",
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  /*
   * ========================================
   * Profile取得エラー
   * ========================================
   */

  if (
    profileError ||
    !profile
  ) {
    return (
      <ThemeProvider
        theme={theme}
      >
        <CssBaseline />

        <Box
          sx={{
            minHeight:
              "100vh",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            px: 3,

            bgcolor:
              "#f7f8fa",
          }}
        >
          <Box
            sx={{
              textAlign:
                "center",
            }}
          >
            <Typography
              sx={{
                mb: 1,

                fontSize:
                  20,

                fontWeight:
                  700,

                color:
                  "#172e5a",
              }}
            >
              ユーザー情報を取得できませんでした
            </Typography>

            <Typography
              sx={{
                color:
                  "text.secondary",
              }}
            >
              {profileError ||
                "プロフィールが登録されていません。"}
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  /*
   * ========================================
   * Role
   * ========================================
   */

  const isPending =
    profile.role ===
    "pending";

  const isStudentPending =
    profile.role ===
    "student_pending";

  const isTeacherPending =
    profile.role ===
    "teacher_pending";

  const isAdmin =
    profile.role ===
    "admin";

  /*
   * ========================================
   * Permissions
   * ========================================
   */

  /*
   * 発表会を作成できる
   *
   * teacher
   * admin
   */
  const canCreateEvent =
    profile.role ===
      "teacher" ||
    profile.role ===
      "admin";

  /*
   * 発表を登録できる
   *
   * student
   * teacher
   * admin
   */
  const canCreatePresentation =
    profile.role ===
      "student" ||
    profile.role ===
      "teacher" ||
    profile.role ===
      "admin";

  /*
   * ========================================
   * Routes
   * ========================================
   */

  return (
    <ThemeProvider
      theme={theme}
    >
      <CssBaseline />

      <Routes>
        {/* =============================== */}
        {/* Root */}
        {/* =============================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/events"
              replace
            />
          }
        />

        {/* =============================== */}
        {/* Register */}
        {/* =============================== */}

        {/*
         * /register
         *
         * pending
         *   → 登録方法選択
         *
         * student_pending
         *   → 学生申請状況
         *
         * teacher_pending
         *   → 教員申請状況
         *
         * 登録済み
         *   → 発表会一覧
         */}

        <Route
          path="/register"
          element={
            isPending ? (
              <RegisterPage />
            ) : isStudentPending ? (
              <Navigate
                to="/register/student"
                replace
              />
            ) : isTeacherPending ? (
              <Navigate
                to="/register/teacher"
                replace
              />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Student Register */}
        {/* =============================== */}

        <Route
          path="/register/student"
          element={
            isPending ||
            isStudentPending ? (
              <StudentRegisterPage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Teacher Register */}
        {/* =============================== */}

        <Route
          path="/register/teacher"
          element={
            isPending ||
            isTeacherPending ? (
              <TeacherRegisterPage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Event List */}
        {/* =============================== */}

        {/*
         * 全roleが閲覧可能
         */}

        <Route
          path="/events"
          element={
            <EventListPage />
          }
        />

        {/* =============================== */}
        {/* Event Create */}
        {/* =============================== */}

        {/*
         * teacher / adminのみ
         */}

        <Route
          path="/events/new"
          element={
            canCreateEvent ? (
              <EventCreatePage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Presentation List */}
        {/* =============================== */}

        {/*
         * 全roleが閲覧可能
         */}

        <Route
          path="/events/:eventId/presentations"
          element={
            <PresentationListPage />
          }
        />

        {/* =============================== */}
        {/* Presentation Create */}
        {/* =============================== */}

        {/*
         * student
         * teacher
         * admin
         *
         * のみ登録可能
         */}

        <Route
          path="/events/:eventId/presentations/new"
          element={
            canCreatePresentation ? (
              <PresentationCreatePage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Presentation Confirm */}
        {/* =============================== */}

        <Route
          path="/events/:eventId/presentations/confirm"
          element={
            canCreatePresentation ? (
              <PresentationConfirmPage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Student List */}
        {/* =============================== */}

        {/*
         * 全roleが閲覧可能
         */}

        <Route
          path="/events/:eventId/students"
          element={
            <StudentListPage />
          }
        />

        {/* =============================== */}
        {/* Admin - Student Requests */}
        {/* =============================== */}

        {/*
         * adminのみ
         */}

        <Route
          path="/admin/students"
          element={
            isAdmin ? (
              <AdminStudentPage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/* =============================== */}
        {/* Admin - Teacher Requests */}
        {/* =============================== */}

        {/*
         * adminのみ
         */}

        <Route
          path="/admin/teachers"
          element={
            isAdmin ? (
              <AdminTeacherPage />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />
        {/* =============================== */}
        {/* 設定 */}
        {/* =============================== */}
        <Route
          path="/settings"
          element={
            <SettingsPage />
          }
        />

        {/* =============================== */}
        {/* Not Found */}
        {/* =============================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/events"
              replace
            />
          }
        />
      </Routes>
    </ThemeProvider>
  );
}