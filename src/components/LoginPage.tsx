import { Box, Button, Paper, Typography } from "@mui/material";
import { School } from "@mui/icons-material";

import { supabase } from "../lib/supabase";

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // React Routerのコールバック画面を作っていない場合は
      // トップページへ戻す
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error("Googleログインエラー:", error);
  }
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: 2,
        display: "grid",
        placeItems: "center",
        bgcolor: "#f7f8fa",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: {
            xs: 3,
            sm: 5,
          },
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <School
          sx={{
            mb: 2,
            fontSize: 58,
            color: "primary.main",
          }}
        />

        <Typography
          component="h1"
          sx={{
            mb: 1,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          卒業発表管理システム
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mb: 4,
            fontSize: 14,
          }}
        >
          Googleアカウントでログインしてください
        </Typography>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => void signInWithGoogle()}
          sx={{
            height: 48,
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Googleでログイン
        </Button>
      </Paper>
    </Box>
  );
}