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
import { theme } from "./theme/theme";

import LoginPage from "./components/LoginPage";
import PresentationListPage from "./pages/PresentationListPage";
import PresentationCreatePage from "./pages/PresentationCreatePage";
import PresentationConfirmPage from "./pages/PresentationConfirmPage";

function App() {
  const {
    session,
    isAuthLoading,
  } = useAuth();

  if (isAuthLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <Box
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            bgcolor: "#f7f8fa",
          }}
        >
          <Typography color="text.secondary">
            読み込み中...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {!session ? (
        <LoginPage />
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <PresentationListPage
                session={session}
              />
            }
          />

          <Route
            path="/presentations/new"
            element={
              <PresentationCreatePage
                session={session}
              />
            }
          />

          <Route
            path="/presentations/confirm"
            element={
              <PresentationConfirmPage
                session={session}
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      )}
    </ThemeProvider>
  );
}

export default App;