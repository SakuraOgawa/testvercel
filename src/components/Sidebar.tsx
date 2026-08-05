import type { Session } from "@supabase/supabase-js";

import {
  Avatar,
  Box,
  Button,
  Typography,
} from "@mui/material";

import {
  Home,
  Logout,
  People,
  School,
  Settings,
  Summarize,
} from "@mui/icons-material";

export const drawerWidth = 256;

type SidebarProps = {
  session: Session;
  onLogout: () => void;
};

const menuItems = [
  {
    id: 1,
    label: "ホーム",
    icon: <Home />,
  },
  {
    id: 2,
    label: "発表一覧",
    icon: <Summarize />,
  },
  {
    id: 3,
    label: "学生一覧",
    icon: <People />,
  },
  {
    id: 4,
    label: "教員一覧",
    icon: <School />,
  },
  {
    id: 5,
    label: "設定",
    icon: <Settings />,
  },
];

export default function Sidebar({
  session,
  onLogout,
}: SidebarProps) {
  const userName =
    session.user.user_metadata?.full_name ??
    session.user.user_metadata?.name ??
    session.user.email ??
    "ユーザー";

  const avatarUrl =
    session.user.user_metadata?.avatar_url ??
    session.user.user_metadata?.picture ??
    undefined;

  return (
    <Box
      component="aside"
      sx={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: drawerWidth,
        display: {
          xs: "none",
          md: "flex",
        },
        flexDirection: "column",
        color: "#ffffff",
        bgcolor: "#172e5a",
        borderRight: "2px solid #2c8cff",
        zIndex: 10,
      }}
    >
      {/* システム名 */}
      <Box
        sx={{
          height: 88,
          px: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <School sx={{ fontSize: 34 }} />

        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          卒業発表管理システム
        </Typography>
      </Box>

      {/* メニュー */}
      <Box
        component="nav"
        sx={{
          px: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {menuItems.map((item) => (
          <Button
            key={item.id}
            startIcon={item.icon}
            sx={{
              height: 44,
              px: 1.5,
              justifyContent: "flex-start",
              gap: 2,
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 1,

              "& .MuiButton-startIcon": {
                mr: 0,
              },

              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>

      {/* ユーザー情報 */}
      <Box
        sx={{
          mt: "auto",
          px: 2.5,
          pb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            src={avatarUrl}
            alt={userName}
            sx={{
              width: 45,
              height: 45,
              bgcolor: "#6f92db",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {userName.slice(0, 1)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                maxWidth: 145,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {userName}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              管理者
            </Typography>
          </Box>
        </Box>

        <Button
          fullWidth
          startIcon={<Logout />}
          onClick={onLogout}
          sx={{
            mt: 2,
            px: 1,
            justifyContent: "flex-start",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          ログアウト
        </Button>
      </Box>
    </Box>
  );
}