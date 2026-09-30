import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Add,
  Search,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import PresentationTable from "../components/PresentationTable";

import FilterSelect from "../components/FilterSelect";

import {
  useAuthContext,
} from "../hooks/useAuthContext";

import {
  supabase,
} from "../lib/supabase";

import type {
  Presentation,
} from "../types/presentation";

/*
 * ========================================
 * Supabaseから取得するデータの型
 * ========================================
 */

type PresentationRow = {
  id: string;

  title: string;

  seminar_name: string;

  created_at: string;

  presenters:
    | {
        student_number: string;
      }[]
    | null;
};

/*
 * ========================================
 * ページネーション
 * ========================================
 */

const rowsPerPage = 5;

/*
 * ========================================
 * PresentationListPage
 * ========================================
 */

export default function PresentationListPage() {
  const navigate =
    useNavigate();

  /*
   * ========================================
   * AuthContext
   * ========================================
   *
   * profileは
   * 「発表を新規登録」ボタンの
   * 表示判定に使用する。
   */

  const {
    profile,
  } = useAuthContext();

  /*
   * ========================================
   * URL
   * ========================================
   *
   * /events/:eventId/presentations
   *
   * からeventIdを取得する。
   */

  const {
    eventId,
  } = useParams<{
    eventId: string;
  }>();

  /*
   * ========================================
   * State
   * ========================================
   */

  const [
    presentations,
    setPresentations,
  ] = useState<
    Presentation[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    keyword,
    setKeyword,
  ] = useState("");

  const [
    seminar,
    setSeminar,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  /*
   * ========================================
   * 発表一覧取得
   * ========================================
   */

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let isCancelled =
      false;

    const fetchPresentations =
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "presentations",
          )
          .select(`
            id,
            title,
            seminar_name,
            created_at,
            presenters (
              student_number
            )
          `)
          .eq(
            "event_id",
            eventId,
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            },
          );

        if (
          isCancelled
        ) {
          return;
        }

        if (error) {
          console.error(
            "発表一覧取得エラー:",
            error,
          );

          setLoadError(
            "発表一覧を取得できませんでした。",
          );

          setIsLoading(
            false,
          );

          return;
        }

        /*
         * Supabaseのレスポンスを
         * Presentation型へ変換する。
         */

        const rows =
          (data ??
            []) as PresentationRow[];

        const formattedPresentations:
          Presentation[] =
          rows.map(
            (row) => ({
              id:
                row.id,

              title:
                row.title,

              seminar_name:
                row.seminar_name,

              created_at:
                row.created_at,

              presenters:
                row.presenters?.map(
                  (
                    presenter,
                  ) => ({
                    student_number:
                      presenter.student_number,
                  }),
                ) ?? [],
            }),
          );

        setPresentations(
          formattedPresentations,
        );

        setLoadError(
          "",
        );

        setIsLoading(
          false,
        );
      };

    void fetchPresentations();

    return () => {
      isCancelled =
        true;
    };
  }, [eventId]);

  /*
   * ========================================
   * ゼミ一覧
   * ========================================
   */

  const seminarOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          presentations
            .map(
              (
                presentation,
              ) =>
                presentation.seminar_name,
            )
            .filter(
              Boolean,
            ),
        ),
      ).sort();
    }, [
      presentations,
    ]);

  /*
   * ========================================
   * 検索・絞り込み
   * ========================================
   */

  const filteredPresentations =
    useMemo(() => {
      const normalizedKeyword =
        keyword
          .trim()
          .toLowerCase();

      return presentations.filter(
        (
          presentation,
        ) => {
          const title =
            presentation.title.toLowerCase();

          const studentNumbers =
            presentation.presenters
              .map(
                (
                  presenter,
                ) =>
                  presenter.student_number,
              )
              .join(" ")
              .toLowerCase();

          const matchesKeyword =
            normalizedKeyword ===
              "" ||
            title.includes(
              normalizedKeyword,
            ) ||
            studentNumbers.includes(
              normalizedKeyword,
            );

          const matchesSeminar =
            seminar ===
              "" ||
            presentation.seminar_name ===
              seminar;

          return (
            matchesKeyword &&
            matchesSeminar
          );
        },
      );
    }, [
      presentations,
      keyword,
      seminar,
    ]);

  /*
   * ========================================
   * ページネーション
   * ========================================
   */

  const pageCount =
    Math.max(
      1,

      Math.ceil(
        filteredPresentations.length /
          rowsPerPage,
      ),
    );

  /*
   * useEffect内でsetPageしない。
   *
   * set-state-in-effect対策。
   */

  const currentPage =
    Math.min(
      page,
      pageCount,
    );

  const startIndex =
    (currentPage -
      1) *
    rowsPerPage;

  const paginatedPresentations =
    useMemo(() => {
      return filteredPresentations.slice(
        startIndex,

        startIndex +
          rowsPerPage,
      );
    }, [
      filteredPresentations,
      startIndex,
    ]);

  /*
   * ========================================
   * 新規登録権限
   * ========================================
   */

  const canCreatePresentation =
    profile?.role ===
      "student" ||
    profile?.role ===
      "teacher" ||
    profile?.role ===
      "admin";

  /*
   * ========================================
   * 新規登録
   * ========================================
   */

  const handleCreatePresentation =
    () => {
      if (!eventId) {
        return;
      }

      navigate(
        `/events/${eventId}/presentations/new`,
      );
    };

  /*
   * ========================================
   * 発表会一覧へ戻る
   * ========================================
   */

  const handleBackToEvents =
    () => {
      navigate(
        "/events",
      );
    };

  /*
   * ========================================
   * eventIdが存在しない
   * ========================================
   */

  if (!eventId) {
    return (
      <Box
        sx={{
          minHeight:
            "100vh",

          display:
            "grid",

          placeItems:
            "center",

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
            color="error"
            sx={{
              mb: 2,
            }}
          >
            発表会を特定できませんでした。
          </Typography>

          <Button
            variant="contained"
            onClick={
              handleBackToEvents
            }
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
            発表会一覧へ戻る
          </Button>
        </Box>
      </Box>
    );
  }

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

              flexDirection: {
                xs:
                  "column",

                sm:
                  "row",
              },

              justifyContent:
                "space-between",

              alignItems: {
                xs:
                  "stretch",

                sm:
                  "center",
              },

              gap: 2,
            }}
          >
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontSize:
                    22,

                  fontWeight:
                    700,

                  color:
                    "#333333",
                }}
              >
                卒論発表一覧
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
                選択した発表会の発表一覧です。
              </Typography>
            </Box>

            {/* ================================= */}
            {/* 発表新規登録 */}
            {/* ================================= */}

            {canCreatePresentation && (
              <Button
                variant="contained"
                startIcon={
                  <Add />
                }
                onClick={
                  handleCreatePresentation
                }
                sx={{
                  bgcolor:
                    "#172e5a",

                  fontWeight:
                    700,

                  textTransform:
                    "none",

                  "&:hover":
                    {
                      bgcolor:
                        "#102447",
                    },
                }}
              >
                発表を新規登録
              </Button>
            )}
          </Box>

          {/* ================================= */}
          {/* 検索・絞り込み */}
          {/* ================================= */}

          <Box
            sx={{
              mb: 2,

              display:
                "flex",

              flexDirection: {
                xs:
                  "column",

                md:
                  "row",
              },

              gap: 1.5,
            }}
          >
            <TextField
              size="small"
              value={
                keyword
              }
              placeholder="タイトル・学籍番号で検索"
              onChange={(
                event,
              ) => {
                setKeyword(
                  event.target
                    .value,
                );

                setPage(
                  1,
                );
              }}
              slotProps={{
                input: {
                  startAdornment:
                    (
                      <InputAdornment position="start">
                        <Search
                          sx={{
                            color:
                              "text.secondary",
                          }}
                        />
                      </InputAdornment>
                    ),
                },
              }}
              sx={{
                width: {
                  xs:
                    "100%",

                  md:
                    360,
                },

                bgcolor:
                  "#ffffff",
              }}
            />

            <FilterSelect
              value={
                seminar
              }
              placeholder="ゼミ名"
              options={
                seminarOptions
              }
              onChange={(
                value,
              ) => {
                setSeminar(
                  value,
                );

                setPage(
                  1,
                );
              }}
            />
          </Box>

          {/* ================================= */}
          {/* Loading */}
          {/* ================================= */}

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

          {/* ================================= */}
          {/* Error */}
          {/* ================================= */}

          {!isLoading &&
            loadError && (
              <Box
                sx={{
                  py: 8,

                  textAlign:
                    "center",
                }}
              >
                <Typography color="error">
                  {
                    loadError
                  }
                </Typography>
              </Box>
            )}

          {/* ================================= */}
          {/* 一覧 */}
          {/* ================================= */}

          {!isLoading &&
            !loadError && (
              <>
                <PresentationTable
                  rows={
                    paginatedPresentations
                  }
                  startIndex={
                    startIndex
                  }
                />

                {filteredPresentations.length >
                  0 && (
                  <Box
                    sx={{
                      mt: 3,

                      display:
                        "flex",

                      justifyContent:
                        "center",
                    }}
                  >
                    <Pagination
                      count={
                        pageCount
                      }
                      page={
                        currentPage
                      }
                      onChange={(
                        _event,
                        value,
                      ) => {
                        setPage(
                          value,
                        );
                      }}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}

          {/* ================================= */}
          {/* 戻る */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 4,
            }}
          >
            <Button
              variant="text"
              onClick={
                handleBackToEvents
              }
              sx={{
                color:
                  "#172e5a",

                fontWeight:
                  700,

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