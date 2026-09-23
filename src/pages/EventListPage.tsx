import {
  useEffect,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  Add,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import EventCard from "../components/EventCard";

import { supabase } from "../lib/supabase";

import type {
  Profile,
} from "../types/profile";

import type {
  PresentationEvent,
} from "../types/presentationEvent";

type EventListPageProps = {
  session: Session;
  profile: Profile;
};

export default function EventListPage({
  session,
  profile,
}: EventListPageProps) {
  const navigate = useNavigate();

  const [
    events,
    setEvents,
  ] = useState<
    PresentationEvent[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  useEffect(() => {
    const fetchEvents =
      async () => {
        setIsLoading(true);

        const {
          data,
          error,
        } = await supabase
          .from(
            "presentation_events",
          )
          .select(`
            id,
            name,
            project_type,
            event_date,
            location,
            created_by,
            created_at
          `)
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

        if (error) {
          console.error(
            "発表会取得エラー:",
            error,
          );

          setLoadError(
            "発表会を取得できませんでした。",
          );

          setIsLoading(false);
          return;
        }

        setEvents(
          (data ?? []) as
            PresentationEvent[],
        );

        setIsLoading(false);
      };

    void fetchEvents();
  }, []);

  const handleEventClick = (
    event: PresentationEvent,
  ) => {
    /*
     * 先生
     * → 発表一覧
     */
    if (profile.role === "teacher") {
      navigate(
        `/events/${event.id}/presentations`,
      );

      return;
    }

    /*
     * 学生
     * → 後で
     * 「自分の登録があるか」
     * 判定するページへ
     */
    navigate(
      `/events/${event.id}/presentations`,
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f8fa",
      }}
    >
      <Sidebar
        session={session}
        onLogout={() => {
          void handleLogout();
        }}
      />

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md: `${drawerWidth}px`,
          },

          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
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
              mb: 3,

              display: "flex",

              justifyContent:
                "space-between",

              alignItems: "center",

              gap: 2,
            }}
          >
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                発表会一覧
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color:
                    "text.secondary",
                  fontSize: 13,
                }}
              >
                参加する発表会を選択してください。
              </Typography>
            </Box>

            {profile.role ===
              "teacher" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  navigate(
                    "/events/new",
                  );
                }}
                sx={{
                  bgcolor:
                    "#172e5a",

                  fontWeight: 700,

                  textTransform:
                    "none",

                  "&:hover": {
                    bgcolor:
                      "#102447",
                  },
                }}
              >
                発表会を新規作成
              </Button>
            )}
          </Box>

          {isLoading && (
            <Box
              sx={{
                py: 8,

                display: "flex",

                justifyContent:
                  "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {!isLoading &&
            loadError && (
              <Typography
                sx={{
                  color:
                    "error.main",

                  textAlign:
                    "center",
                }}
              >
                {loadError}
              </Typography>
            )}

          {!isLoading &&
            !loadError && (
              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns:
                    {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                      xl: "repeat(3, 1fr)",
                    },

                  gap: 2,
                }}
              >
                {events.map(
                  (event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => {
                        handleEventClick(
                          event,
                        );
                      }}
                    />
                  ),
                )}
              </Box>
            )}

          {!isLoading &&
            !loadError &&
            events.length === 0 && (
              <Typography
                sx={{
                  py: 8,
                  color:
                    "text.secondary",
                  textAlign:
                    "center",
                }}
              >
                現在登録されている発表会はありません。
              </Typography>
            )}
        </Box>
      </Box>
    </Box>
  );
}