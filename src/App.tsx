import {
  Box,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";

import { theme } from "./theme/theme";

import LoginPage from "./components/LoginPage";

import EventListPage from "./pages/EventListPage";
import EventCreatePage from "./pages/EventCreatePage";

import PresentationListPage from "./pages/PresentationListPage";
import PresentationCreatePage from "./pages/PresentationCreatePage";
import PresentationConfirmPage from "./pages/PresentationConfirmPage";
import StudentListPage from "./pages/StudentListPage"

function App() {
  /*
   * ========================================
   * Authentication
   * ========================================
   */

  const {
    session,
    isAuthLoading,
  } = useAuth();

  /*
   * ========================================
   * Profile
   * ========================================
   */

  const {
    profile,
    isProfileLoading,
    profileError,
  } = useProfile(
    session?.user.id,
  );

  /*
   * ========================================
   * 認証・プロフィール読み込み中
   * ========================================
   */

  if (
    isAuthLoading ||
    (
      session &&
      isProfileLoading
    )
  ) {
    return (
      <ThemeProvider
        theme={theme}
      >
        <CssBaseline />

        <Box
          sx={{
            minHeight: "100vh",

            display: "grid",

            placeItems:
              "center",

            bgcolor:
              "#f7f8fa",
          }}
        >
          <Typography>
            読み込み中...
          </Typography>
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
   * Profile取得失敗
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
            minHeight: "100vh",

            display: "grid",

            placeItems:
              "center",

            bgcolor:
              "#f7f8fa",
          }}
        >
          <Typography
            color="error"
          >
            {profileError ||
              "プロフィールが登録されていません。"}
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  /*
   * ========================================
   * ログイン済み
   * ========================================
   */

  return (
    <ThemeProvider
      theme={theme}
    >
      <CssBaseline />

      <Routes>
        {/*
         * ==================================
         * /
         *
         * トップページ
         * → 発表会一覧
         * ==================================
         */}

        <Route
          path="/"
          element={
            <Navigate
              to="/events"
              replace
            />
          }
        />

        {/*
         * ==================================
         * /events
         *
         * 発表会一覧
         *
         * 学生・先生共通
         * ==================================
         */}

        <Route
          path="/events"
          element={
            <EventListPage
              session={session}
              profile={profile}
            />
          }
        />

        {/*
         * ==================================
         * /events/new
         *
         * 発表会新規作成
         *
         * 先生のみ
         * ==================================
         */}

        <Route
          path="/events/new"
          element={
            profile.role ===
            "teacher" ? (
              <EventCreatePage
                session={session}
              />
            ) : (
              <Navigate
                to="/events"
                replace
              />
            )
          }
        />

        {/*
         * ==================================
         * 発表会ごとの発表一覧
         *
         * 例:
         *
         * /events/abc123/presentations
         * ==================================
         */}

        <Route
          path="/events/:eventId/presentations"
          element={
            <PresentationListPage
              session={session}
            />
          }
        />

        {/*
         * ==================================
         * 発表新規登録
         *
         * 例:
         *
         * /events/abc123/presentations/new
         * ==================================
         */}

        <Route
          path="/events/:eventId/presentations/new"
          element={
            <PresentationCreatePage
              session={session}
            />
          }
        />

        {/*
         * ==================================
         * 発表登録確認
         *
         * 例:
         *
         * /events/abc123/presentations/confirm
         * ==================================
         */}

        <Route
          path="/events/:eventId/presentations/confirm"
          element={
            <PresentationConfirmPage
              session={session}
            />
          }
        />
        {/*
         * ==================================
         * 学生一覧確認
         *
         * 例:
         *
         * /events/abc123/students
         * ==================================
         */}
        <Route
          path="/events/:eventId/students"
          element={
            <StudentListPage
              session={session}
            />
          }
        />

        {/*
         * ==================================
         * 存在しないURL
         *
         * → 発表会一覧
         * ==================================
         */}

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

export default App;