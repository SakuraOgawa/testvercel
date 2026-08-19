import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Session } from "@supabase/supabase-js";

import {
  Add,
  Search,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

import FilterSelect from "../components/FilterSelect";

import PresentationTable from "../components/PresentationTable";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import type { Presentation } from "../types/presentation";

type PresentationListPageProps = {
  session: Session;
};

const rowsPerPage = 5;

export default function PresentationListPage({
  session,
}: PresentationListPageProps) {
  const navigate = useNavigate();

  const [
    presentations,
    setPresentations,
  ] = useState<Presentation[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [keyword, setKeyword] =
    useState("");

  const [seminar, setSeminar] =
    useState("");

  const [page, setPage] =
    useState(1);

  /*
   * =========================================
   * Supabaseから発表一覧を取得
   * =========================================
   */
  useEffect(() => {
    const fetchPresentations = async () => {
      setIsLoading(true);
      setLoadError("");

      /*
       * presentations
       *
       *     ↓ FK
       *
       * presenters
       *
       * をまとめて取得
       */
      const {
        data,
        error,
      } = await supabase
        .from("presentations")
        .select(`
          id,
          title,
          seminar_name,
          created_at,
          presenters (
            presenter_name
          )
        `)
        .order(
          "created_at",
          {
            ascending: true,
          },
        );

      if (error) {
        console.error(
          "発表一覧取得エラー:",
          error,
        );

        setLoadError(
          "発表一覧の取得に失敗しました。",
        );

        setIsLoading(false);

        return;
      }

      setPresentations(
        (data ?? []) as Presentation[],
      );

      setIsLoading(false);
    };

    void fetchPresentations();
  }, []);

  /*
   * =========================================
   * ゼミ一覧
   * =========================================
   */
  const seminarOptions =
    useMemo(() => {
      return [
        ...new Set(
          presentations
            .map(
              (presentation) =>
                presentation.seminar_name,
            )
            .filter(Boolean),
        ),
      ];
    }, [presentations]);

  /*
   * =========================================
   * 検索・絞り込み
   * =========================================
   */
  const filteredPresentations =
    useMemo(() => {
      const normalizedKeyword =
        keyword
          .trim()
          .toLowerCase();

      return presentations.filter(
        (presentation) => {
          /*
           * 発表者名を1つの文字列にする
           *
           * 山田太郎、佐藤花子
           */
          const presenterNames =
            presentation.presenters
              .map(
                (presenter) =>
                  presenter.presenter_name,
              )
              .join(" ")
              .toLowerCase();

          const matchesKeyword =
            normalizedKeyword === "" ||
            presentation.title
              .toLowerCase()
              .includes(
                normalizedKeyword,
              ) ||
            presenterNames.includes(
              normalizedKeyword,
            );

          const matchesSeminar =
            seminar === "" ||
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
   * =========================================
   * ページ数
   * =========================================
   */
  const pageCount = Math.max(
    1,
    Math.ceil(
      filteredPresentations.length /
        rowsPerPage,
    ),
  );

  const currentPage = Math.min(
    page,
    pageCount,
  );

  /*
   * =========================================
   * 現在のページのデータ
   * =========================================
   */
  const displayedPresentations =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        rowsPerPage;

      const endIndex =
        startIndex +
        rowsPerPage;

      return filteredPresentations.slice(
        startIndex,
        endIndex,
      );
    }, [
      filteredPresentations,
      currentPage,
    ]);

  /*
   * 発表番号の開始位置
   *
   * 1ページ目 → 0
   * 2ページ目 → 5
   * 3ページ目 → 10
   */
  const startIndex =
    (currentPage - 1) *
    rowsPerPage;

  /*
   * =========================================
   * 新規登録
   * =========================================
   */
  const handleCreatePresentation =
    () => {
      navigate(
        "/presentations/new",
      );
    };

  /*
   * =========================================
   * ログアウト
   * =========================================
   */
  const handleLogout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "ログアウトエラー:",
        error,
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
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
          minHeight: "100vh",

          ml: {
            xs: 0,
            md: `${drawerWidth}px`,
          },
        }}
      >
        <Box
          sx={{
            px: {
              xs: 2,
              sm: 3,
              md: 4.5,
            },

            pt: 4,
            pb: 7,
          }}
        >
          {/* ============================== */}
          {/* タイトル */}
          {/* ============================== */}

          <Box
            sx={{
              display: "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              alignItems: {
                xs: "stretch",
                sm: "center",
              },

              justifyContent:
                "space-between",

              gap: 2,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: 21,
                fontWeight: 700,
                color: "#333333",
              }}
            >
              卒論発表一覧
            </Typography>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={
                handleCreatePresentation
              }
              sx={{
                minWidth: 160,
                height: 44,
                px: 2.5,

                borderRadius: 1.5,

                bgcolor: "#172e5a",

                fontSize: 13,
                fontWeight: 700,

                textTransform:
                  "none",

                boxShadow: "none",

                "&:hover": {
                  bgcolor:
                    "#102447",

                  boxShadow: "none",
                },
              }}
            >
              発表を新規登録
            </Button>
          </Box>

          <Divider
            sx={{
              mt: 1.5,
              mb: 3.5,
            }}
          />

          {/* ============================== */}
          {/* 検索・絞り込み */}
          {/* ============================== */}

          <Box
            sx={{
              mb: 3,

              display: "flex",

              flexDirection: {
                xs: "column",
                lg: "row",
              },

              alignItems: {
                xs: "stretch",
                lg: "center",
              },

              gap: 1.2,
            }}
          >
            <TextField
              value={keyword}
              onChange={(event) => {
                setKeyword(
                  event.target.value,
                );

                setPage(1);
              }}
              placeholder="タイトル・発表者名で検索"
              size="small"
              sx={{
                width: {
                  xs: "100%",
                  lg: 330,
                },

                bgcolor: "#ffffff",

                "& .MuiOutlinedInput-root":
                  {
                    height: 40,
                    borderRadius: 0,
                    fontSize: 13,

                    boxShadow:
                      "0 2px 5px rgba(0,0,0,0.12)",
                  },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search
                        sx={{
                          color:
                            "#b0b0b0",
                        }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FilterSelect
              value={seminar}
              placeholder="ゼミ名で絞り込み"
              options={seminarOptions}
              onChange={(value) => {
                setSeminar(value);
                setPage(1);
              }}
            />
          </Box>

          {/* ============================== */}
          {/* 読み込み中 */}
          {/* ============================== */}

          {isLoading && (
            <Box
              sx={{
                py: 8,

                display: "flex",

                justifyContent:
                  "center",

                alignItems: "center",
              }}
            >
              <CircularProgress
                size={32}
              />
            </Box>
          )}

          {/* ============================== */}
          {/* エラー */}
          {/* ============================== */}

          {!isLoading &&
            loadError && (
              <Typography
                role="alert"
                sx={{
                  py: 4,

                  color:
                    "error.main",

                  textAlign:
                    "center",

                  fontSize: 13,
                }}
              >
                {loadError}
              </Typography>
            )}

          {/* ============================== */}
          {/* 発表一覧 */}
          {/* ============================== */}

          {!isLoading &&
            !loadError && (
              <>
                <PresentationTable
                  rows={
                    displayedPresentations
                  }
                  startIndex={
                    startIndex
                  }
                />

                <Box
                  sx={{
                    mt: 7,

                    display: "flex",

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
                      _,
                      selectedPage,
                    ) => {
                      setPage(
                        selectedPage,
                      );
                    }}
                    shape="rounded"
                    size="small"
                    sx={{
                      "& .MuiPaginationItem-root":
                        {
                          minWidth:
                            28,

                          height:
                            28,

                          borderRadius:
                            0,

                          fontSize:
                            13,
                        },

                      "& .Mui-selected":
                        {
                          bgcolor:
                            "#edf1f8 !important",

                          color:
                            "#5471aa",
                        },
                    }}
                  />
                </Box>
              </>
            )}
        </Box>
      </Box>
    </Box>
  );
}