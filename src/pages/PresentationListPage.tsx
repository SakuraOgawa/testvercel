import { useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

import {
  Add,
  Search,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Divider,
  InputAdornment,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";

import { supabase } from "../lib/supabase";
import { presentations } from "../data/Presentations";

import FilterSelect from "../components/FilterSelect";
import PresentationTable from "../components/PresentationTable";
import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

type PresentationListPageProps = {
  session: Session;
};

const rowsPerPage = 5;

export default function PresentationListPage({
  session,
}: PresentationListPageProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [seminar, setSeminar] = useState("");
  const [teacher, setTeacher] = useState("");
  const [page, setPage] = useState(1);

  const seminarOptions = useMemo(() => {
    return [
      ...new Set(
        presentations.map(
          (presentation) => presentation.seminarName,
        ),
      ),
    ];
  }, []);

  const teacherOptions = useMemo(() => {
    return [
      ...new Set(
        presentations.map(
          (presentation) => presentation.teacherName,
        ),
      ),
    ];
  }, []);

  const filteredPresentations = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return presentations.filter((presentation) => {
      const matchesKeyword =
        normalizedKeyword === "" ||
        presentation.title
          .toLowerCase()
          .includes(normalizedKeyword) ||
        presentation.studentName
          .toLowerCase()
          .includes(normalizedKeyword) ||
        presentation.studentNumber
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesSeminar =
        seminar === "" ||
        presentation.seminarName === seminar;

      const matchesTeacher =
        teacher === "" ||
        presentation.teacherName === teacher;

      return (
        matchesKeyword &&
        matchesSeminar &&
        matchesTeacher
      );
    });
  }, [keyword, seminar, teacher]);

  const pageCount = Math.max(
    1,
    Math.ceil(
      filteredPresentations.length / rowsPerPage,
    ),
  );

  // ページ番号が最大ページ数を超えないようにする
  const currentPage = Math.min(page, pageCount);

  const displayedPresentations = useMemo(() => {
    const startIndex =
      (currentPage - 1) * rowsPerPage;

    const endIndex =
      startIndex + rowsPerPage;

    return filteredPresentations.slice(
      startIndex,
      endIndex,
    );
  }, [filteredPresentations, currentPage]);

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

  const handleCreatePresentation = () => {
    navigate("/presentations/new");
  };

  const handleKeywordChange = (
    value: string,
  ) => {
    setKeyword(value);
    setPage(1);
  };

  const handleSeminarChange = (
    value: string,
  ) => {
    setSeminar(value);
    setPage(1);
  };

  const handleTeacherChange = (
    value: string,
  ) => {
    setTeacher(value);
    setPage(1);
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
              justifyContent: "space-between",
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

            <Box
              sx={{
                display: "flex",
                justifyContent: {
                  xs: "stretch",
                  sm: "flex-end",
                },
              }}
            >
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
                  textTransform: "none",
                  boxShadow: "none",

                  "&:hover": {
                    bgcolor: "#102447",
                    boxShadow: "none",
                  },
                }}
              >
                発表を新規登録
              </Button>
            </Box>
          </Box>

          <Divider
            sx={{
              mt: 1.5,
              mb: 3.5,
            }}
          />

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
                handleKeywordChange(
                  event.target.value,
                );
              }}
              placeholder="タイトル・氏名・学籍番号で検索"
              size="small"
              sx={{
                width: {
                  xs: "100%",
                  lg: 330,
                },
                bgcolor: "#ffffff",

                "& .MuiOutlinedInput-root": {
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
                          color: "#b0b0b0",
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
              onChange={handleSeminarChange}
            />

            <FilterSelect
              value={teacher}
              placeholder="教員名で絞り込み"
              options={teacherOptions}
              onChange={handleTeacherChange}
            />
          </Box>

          <PresentationTable
            rows={displayedPresentations}
          />

          <Box
            sx={{
              mt: 7,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(
                _,
                selectedPage,
              ) => {
                setPage(selectedPage);
              }}
              shape="rounded"
              size="small"
              sx={{
                "& .MuiPaginationItem-root":
                  {
                    minWidth: 28,
                    height: 28,
                    borderRadius: 0,
                    fontSize: 13,
                  },

                "& .Mui-selected": {
                  bgcolor:
                    "#edf1f8 !important",
                  color: "#5471aa",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}