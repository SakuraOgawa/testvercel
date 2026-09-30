import {
  useEffect,
  useState,
} from "react";

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

import {
  useAuthContext,
} from "../hooks/useAuthContext";

import {
  supabase,
} from "../lib/supabase";

import type {
  PresentationEvent,
} from "../types/presentationEvent";

/*
 * ========================================
 * EventListPage
 * ========================================
 */

export default function EventListPage() {
  const navigate =
    useNavigate();

  /*
   * ========================================
   * AuthContext
   * ========================================
   */

  const {
    profile,
  } = useAuthContext();

  /*
   * ========================================
   * State
   * ========================================
   */

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

  /*
   * ========================================
   * 発表会取得
   * ========================================
   */

  useEffect(() => {
    let isCancelled =
      false;

    const fetchEvents =
      async () => {
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

        /*
         * ページ離脱後なら
         * stateを更新しない
         */
        if (isCancelled) {
          return;
        }

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

        setLoadError("");

        setIsLoading(false);
      };

    void fetchEvents();

    /*
     * ========================================
     * Cleanup
     * ========================================
     */

    return () => {
      isCancelled = true;
    };
  }, []);

  /*
   * ========================================
   * Profile Guard
   * ========================================
   *
   * App.tsx側でもprofileの存在を
   * 確認しているが、
   * TypeScript上ではnullの可能性がある。
   */

  if (!profile) {
    return null;
  }

  /*
   * ========================================
   * 発表会選択
   * ========================================
   */

  const handleEventClick = (
    event: PresentationEvent,
  ) => {
    /*
     * 現時点ではroleに関係なく
     * 発表一覧へ移動する。
     *
     * 将来的にstudentだけ
     *
     * ・自分の発表が存在する
     *   → 編集画面
     *
     * ・存在しない
     *   → 新規登録
     *
     * のように分岐可能。
     */

    navigate(
      `/events/${event.id}/presentations`,
    );
  };

  /*
   * ========================================
   * 発表会作成権限
   * ========================================
   */

  const canCreateEvent =
    profile.role ===
      "teacher" ||
    profile.role ===
      "admin";

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

          minHeight:
            "100vh",
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
          {/* ================================= */}
          {/* Header */}
          {/* ================================= */}

          <Box
            sx={{
              mb: 3,

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap: 2,

              flexWrap:
                "wrap",
            }}
          >
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontSize: 22,

                  fontWeight:
                    700,

                  color:
                    "#333333",
                }}
              >
                発表会一覧
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
                参加する発表会を選択してください。
              </Typography>
            </Box>

            {/* ================================= */}
            {/* 発表会新規作成 */}
            {/* ================================= */}

            {canCreateEvent && (
              <Button
                variant="contained"
                startIcon={
                  <Add />
                }
                onClick={() => {
                  navigate(
                    "/events/new",
                  );
                }}
                sx={{
                  bgcolor:
                    "#172e5a",

                  fontWeight:
                    700,

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

          {/* ================================= */}
          {/* Loading */}
          {/* ================================= */}

          {isLoading && (
            <Box
              sx={{
                py: 8,

                display:
                  "flex",

                justifyContent:
                  "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* ================================= */}
          {/* Error */}
          {/* ================================= */}

          {!isLoading &&
            loadError && (
              <Typography
                sx={{
                  py: 8,

                  color:
                    "error.main",

                  textAlign:
                    "center",
                }}
              >
                {loadError}
              </Typography>
            )}

          {/* ================================= */}
          {/* Event List */}
          {/* ================================= */}

          {!isLoading &&
            !loadError &&
            events.length >
              0 && (
              <Box
                sx={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    {
                      xs:
                        "1fr",

                      md:
                        "repeat(2, minmax(0, 1fr))",

                      xl:
                        "repeat(3, minmax(0, 1fr))",
                    },

                  gap: 2,
                }}
              >
                {events.map(
                  (event) => (
                    <EventCard
                      key={
                        event.id
                      }
                      event={
                        event
                      }
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

          {/* ================================= */}
          {/* Empty */}
          {/* ================================= */}

          {!isLoading &&
            !loadError &&
            events.length ===
              0 && (
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