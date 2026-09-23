import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  Search,
} from "@mui/icons-material";

import {
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Navigate,
  useParams,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import { supabase } from "../lib/supabase";

type StudentListPageProps = {
  session: Session;
};

type Student = {
  studentNumber: string;
};

export default function StudentListPage({
  session,
}: StudentListPageProps) {
  /*
   * URL:
   *
   * /events/:eventId/students
   *
   * からeventIdを取得
   */
  const { eventId } = useParams<{
    eventId: string;
  }>();

  /*
   * ========================================
   * State
   * ========================================
   */

  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);

  const [
    keyword,
    setKeyword,
  ] = useState("");

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
   * 学生一覧取得
   * ========================================
   *
   * presentations
   *     ↓
   * presenters
   *     ↓
   * student_number
   *
   * という関係から取得する。
   * ========================================
   */

  useEffect(() => {
    /*
     * eventIdがない場合は、
     * 下のNavigateで/eventsへ戻す。
     */
    if (!eventId) {
      return;
    }

    let isCancelled = false;

    const fetchStudents =
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("presentations")
          .select(`
            id,
            presenters (
              student_number
            )
          `)
          .eq(
            "event_id",
            eventId,
          );

        /*
         * コンポーネントが
         * アンマウント済みなら
         * stateを更新しない
         */
        if (isCancelled) {
          return;
        }

        /*
         * Supabaseエラー
         */
        if (error) {
          console.error(
            "学生一覧取得エラー:",
            error,
          );

          setLoadError(
            "学生一覧を取得できませんでした。",
          );

          setIsLoading(false);

          return;
        }

        /*
         * ==================================
         * 学籍番号を取り出す
         * ==================================
         */

        const studentNumbers =
          (data ?? []).flatMap(
            (presentation) =>
              (
                presentation.presenters ??
                []
              )
                .map(
                  (presenter) =>
                    presenter.student_number,
                )
                .filter(
                  (
                    studentNumber,
                  ): studentNumber is string =>
                    Boolean(
                      studentNumber,
                    ),
                ),
          );

        /*
         * ==================================
         * 重複削除
         * ==================================
         *
         * 例えば、
         *
         * G23934
         * G23935
         * G23934
         *
         * ↓
         *
         * G23934
         * G23935
         *
         * にする。
         * ==================================
         */

        const uniqueStudentNumbers =
          Array.from(
            new Set(
              studentNumbers,
            ),
          );

        /*
         * 学籍番号順に並べる
         */
        uniqueStudentNumbers.sort(
          (a, b) =>
            a.localeCompare(
              b,
              "ja",
              {
                numeric: true,
              },
            ),
        );

        /*
         * Student型へ変換
         */
        const studentList: Student[] =
          uniqueStudentNumbers.map(
            (studentNumber) => ({
              studentNumber,
            }),
          );

        setStudents(
          studentList,
        );

        setLoadError("");

        setIsLoading(false);
      };

    void fetchStudents();

    return () => {
      isCancelled = true;
    };
  }, [eventId]);

  /*
   * ========================================
   * 検索
   * ========================================
   */

  const filteredStudents =
    useMemo(() => {
      const normalizedKeyword =
        keyword
          .trim()
          .toLowerCase();

      if (!normalizedKeyword) {
        return students;
      }

      return students.filter(
        (student) =>
          student.studentNumber
            .toLowerCase()
            .includes(
              normalizedKeyword,
            ),
      );
    }, [
      students,
      keyword,
    ]);

  /*
   * ========================================
   * ログアウト
   * ========================================
   */

  const handleLogout =
    async () => {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "ログアウトエラー:",
          error,
        );
      }
    };

  /*
   * ========================================
   * eventIdなし
   * ========================================
   */

  if (!eventId) {
    return (
      <Navigate
        to="/events"
        replace
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",

        bgcolor: "#f7f8fa",
      }}
    >
      {/* ================================= */}
      {/* Sidebar */}
      {/* ================================= */}

      <Sidebar
        session={session}
        onLogout={() => {
          void handleLogout();
        }}
      />

      {/* ================================= */}
      {/* Main */}
      {/* ================================= */}

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

            py: 4,
          }}
        >
          {/* ============================= */}
          {/* タイトル */}
          {/* ============================= */}

          <Box
            sx={{
              mb: 3,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: 22,

                fontWeight: 700,

                color: "#333333",
              }}
            >
              学生一覧
            </Typography>

            <Typography
              sx={{
                mt: 0.5,

                color:
                  "text.secondary",

                fontSize: 13,
              }}
            >
              この発表会に登録されている学生の一覧です。
            </Typography>
          </Box>

          {/* ============================= */}
          {/* 検索 */}
          {/* ============================= */}

          <Box
            sx={{
              mb: 2,

              display: "flex",

              justifyContent:
                "space-between",

              alignItems: {
                xs: "stretch",
                sm: "center",
              },

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              gap: 2,
            }}
          >
            <TextField
              size="small"

              value={keyword}

              placeholder="学籍番号で検索"

              onChange={(
                event,
              ) => {
                setKeyword(
                  event.target
                    .value,
                );
              }}

              slotProps={{
                input: {
                  startAdornment: (
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
                  xs: "100%",
                  sm: 320,
                },

                bgcolor:
                  "#ffffff",

                "& .MuiOutlinedInput-root":
                  {
                    fontSize: 13,

                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.06)",
                  },
              }}
            />

            {!isLoading &&
              !loadError && (
                <Typography
                  sx={{
                    color:
                      "text.secondary",

                    fontSize: 13,
                  }}
                >
                  {
                    filteredStudents.length
                  }
                  人
                </Typography>
              )}
          </Box>

          {/* ============================= */}
          {/* 読み込み中 */}
          {/* ============================= */}

          {isLoading && (
            <Box
              sx={{
                py: 10,

                display: "flex",

                justifyContent:
                  "center",
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* ============================= */}
          {/* エラー */}
          {/* ============================= */}

          {!isLoading &&
            loadError && (
              <Box
                sx={{
                  py: 8,

                  textAlign:
                    "center",
                }}
              >
                <Typography
                  color="error"
                  sx={{
                    fontSize: 13,
                  }}
                >
                  {loadError}
                </Typography>
              </Box>
            )}

          {/* ============================= */}
          {/* 学生一覧 */}
          {/* ============================= */}

          {!isLoading &&
            !loadError && (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border:
                    "1px solid #e0e0e0",

                  borderRadius: 1.5,

                  overflow: "hidden",

                  boxShadow:
                    "0 2px 5px rgba(0,0,0,0.05)",
                }}
              >
                <Table>
                  {/* ===================== */}
                  {/* ヘッダー */}
                  {/* ===================== */}

                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor:
                          "#f7f8fa",
                      }}
                    >
                      <TableCell
                        sx={{
                          width: 100,

                          color:
                            "#555555",

                          fontSize: 12,

                          fontWeight:
                            700,
                        }}
                      >
                        No.
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#555555",

                          fontSize: 12,

                          fontWeight:
                            700,
                        }}
                      >
                        学籍番号
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  {/* ===================== */}
                  {/* Body */}
                  {/* ===================== */}

                  <TableBody>
                    {filteredStudents.length ===
                    0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          align="center"
                          sx={{
                            py: 7,

                            color:
                              "text.secondary",

                            fontSize:
                              13,
                          }}
                        >
                          {keyword
                            ? "該当する学生が見つかりませんでした。"
                            : "学生がまだ登録されていません。"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map(
                        (
                          student,
                          index,
                        ) => (
                          <TableRow
                            key={
                              student.studentNumber
                            }
                            hover
                            sx={{
                              "&:last-child td":
                                {
                                  borderBottom:
                                    0,
                                },
                            }}
                          >
                            <TableCell
                              sx={{
                                color:
                                  "#777777",

                                fontSize:
                                  13,
                              }}
                            >
                              {index +
                                1}
                            </TableCell>

                            <TableCell
                              sx={{
                                color:
                                  "#333333",

                                fontSize:
                                  13,

                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                student.studentNumber
                              }
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
        </Box>
      </Box>
    </Box>
  );
}