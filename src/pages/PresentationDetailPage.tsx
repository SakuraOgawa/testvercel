import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import {
  ArrowBack,
  Description,
  Edit,
  GitHub,
  OpenInNew,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import { useAuthContext } from "../hooks/useAuthContext";

import { supabase } from "../lib/supabase";
import { canEditPresentation as checkPresentationEditPermission } from "../lib/presentationPermissions";

import "../styles/markdown.css";

/*
 * ========================================
 * Types
 * ========================================
 */

type Presenter = {
  student_number: string;
};

type PresentationDetail = {
  id: string;
  event_id: string;
  owner: string;
  title: string;
  seminar_name: string;
  summary: string | null;
  material_url: string | null;
  github_url: string | null;
  created_at: string;
  presenters: Presenter[];
};

/*
 * Supabaseから取得した直後のデータ型
 *
 * presentersはリレーションなので、
 * nullになる可能性も考慮する。
 */
type PresentationDetailRow = {
  id: string;
  event_id: string;
  owner: string;
  title: string;
  seminar_name: string;
  summary: string | null;
  material_url: string | null;
  github_url: string | null;
  created_at: string;

  presenters:
    | {
        student_number: string;
      }[]
    | null;
};

/*
 * ========================================
 * PresentationDetailPage
 * ========================================
 */

export default function PresentationDetailPage() {
  const navigate = useNavigate();

  /*
   * ========================================
   * AuthContext
   * ========================================
   *
   * session
   *   → owner判定に使用
   *
   * profile
   *   → 発表者の学籍番号判定に使用
   */
  const {
    session,
    profile,
  } = useAuthContext();

  /*
   * ========================================
   * URL
   * ========================================
   *
   * /events/:eventId/presentations/:presentationId
   */
  const {
    eventId,
    presentationId,
  } = useParams<{
    eventId: string;
    presentationId: string;
  }>();

  /*
   * ========================================
   * State
   * ========================================
   */

  const [
    presentation,
    setPresentation,
  ] = useState<PresentationDetail | null>(
    null,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const canEditPresentation = checkPresentationEditPermission(
    presentation,
    session?.user.id,
    profile,
  );

  /*
   * ========================================
   * 発表詳細取得
   * ========================================
   */

  useEffect(() => {
    if (
      !eventId ||
      !presentationId
    ) {
      return;
    }

    let isCancelled = false;

    const fetchPresentation =
      async () => {
        setIsLoading(true);
        setLoadError("");

        const {
          data,
          error,
        } = await supabase
          .from("presentations")
          .select(`
            id,
            event_id,
            owner,
            title,
            seminar_name,
            summary,
            material_url,
            github_url,
            created_at,
            presenters (
              student_number
            )
          `)
          .eq(
            "id",
            presentationId,
          )
          .eq(
            "event_id",
            eventId,
          )
          .maybeSingle();

        if (isCancelled) {
          return;
        }

        /*
         * Supabaseエラー
         */
        if (error) {
          console.error(
            "発表詳細取得エラー:",
            error,
          );

          setPresentation(null);

          setLoadError(
            "発表情報を取得できませんでした。",
          );

          setIsLoading(false);

          return;
        }

        /*
         * 発表が存在しない
         */
        if (!data) {
          setPresentation(null);

          setLoadError(
            "指定された発表が見つかりませんでした。",
          );

          setIsLoading(false);

          return;
        }

        /*
         * Supabaseのレスポンスを
         * 画面で扱いやすい形へ変換
         */
        const row =
          data as PresentationDetailRow;

        setPresentation({
          id: row.id,

          event_id:
            row.event_id,

          owner:
            row.owner,

          title:
            row.title,

          seminar_name:
            row.seminar_name,

          summary:
            row.summary,

          material_url:
            row.material_url,

          github_url:
            row.github_url,

          created_at:
            row.created_at,

          presenters:
            row.presenters?.map(
              (presenter) => ({
                student_number:
                  presenter.student_number,
              }),
            ) ?? [],
        });

        setLoadError("");

        setIsLoading(false);
      };

    void fetchPresentation();

    return () => {
      isCancelled = true;
    };
  }, [
    eventId,
    presentationId,
  ]);

  /*
   * ========================================
   * 発表一覧へ戻る
   * ========================================
   */

  const handleBack = () => {
    if (!eventId) {
      navigate("/events");

      return;
    }

    navigate(
      `/events/${eventId}/presentations`,
    );
  };

  /*
   * ========================================
   * 発表編集画面へ
   * ========================================
   *
   * 11-5で編集画面を作成する。
   *
   * ここでもcanEditPresentationを確認し、
   * 編集権限がない場合は遷移させない。
   */
  const handleEdit = () => {
    if (
      !eventId ||
      !presentationId ||
      !canEditPresentation
    ) {
      return;
    }

    navigate(
      `/events/${eventId}/presentations/${presentationId}/edit`,
    );
  };

  /*
   * ========================================
   * URLを開く
   * ========================================
   */

  const handleOpenUrl = (
    url: string,
  ) => {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  };

  /*
   * ========================================
   * URLパラメータ不足
   * ========================================
   */

  if (
    !eventId ||
    !presentationId
  ) {
    return (
      <Box
        sx={{
          minHeight: "100vh",

          bgcolor:
            "#f7f8fa",

          display:
            "grid",

          placeItems:
            "center",
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
            発表を特定できませんでした。
          </Typography>

          <Button
            variant="contained"
            onClick={() => {
              navigate(
                "/events",
              );
            }}
            sx={{
              bgcolor:
                "#172e5a",

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
          {/* 戻る */}
          {/* ================================= */}

          <Button
            variant="text"
            startIcon={
              <ArrowBack />
            }
            onClick={
              handleBack
            }
            sx={{
              mb: 2,

              color:
                "#172e5a",

              fontWeight:
                700,

              textTransform:
                "none",
            }}
          >
            発表一覧へ戻る
          </Button>

          {/* ================================= */}
          {/* 読み込み中 */}
          {/* ================================= */}

          {isLoading && (
            <Box
              sx={{
                py: 12,

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
          {/* エラー */}
          {/* ================================= */}

          {!isLoading &&
            loadError && (
              <Alert
                severity="error"
                sx={{
                  maxWidth:
                    900,
                }}
              >
                {
                  loadError
                }
              </Alert>
            )}

          {/* ================================= */}
          {/* 発表詳細 */}
          {/* ================================= */}

          {!isLoading &&
            !loadError &&
            presentation && (
              <Box
                sx={{
                  maxWidth:
                    1000,
                }}
              >
                {/* ========================= */}
                {/* タイトル + 編集ボタン */}
                {/* ========================= */}

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

                    alignItems: {
                      xs:
                        "flex-start",
                      sm:
                        "flex-start",
                    },

                    justifyContent:
                      "space-between",

                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: {
                          xs: 24,
                          md: 28,
                        },

                        fontWeight:
                          700,

                        color:
                          "#222222",

                        lineHeight:
                          1.4,
                      }}
                    >
                      {
                        presentation.title
                      }
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.8,

                        color:
                          "text.secondary",

                        fontSize:
                          13,
                      }}
                    >
                      発表詳細
                    </Typography>
                  </Box>

                  {/* ===================== */}
                  {/* 編集可能な人だけ表示 */}
                  {/* ===================== */}

                  {canEditPresentation && (
                    <Button
                      type="button"
                      variant="contained"
                      startIcon={
                        <Edit />
                      }
                      onClick={
                        handleEdit
                      }
                      sx={{
                        flexShrink:
                          0,

                        bgcolor:
                          "#172e5a",

                        fontSize:
                          13,

                        fontWeight:
                          700,

                        textTransform:
                          "none",

                        boxShadow:
                          "0 2px 5px rgba(0,0,0,0.12)",

                        "&:hover":
                          {
                            bgcolor:
                              "#102447",
                          },
                      }}
                    >
                      発表を編集
                    </Button>
                  )}
                </Box>

                {/* ========================= */}
                {/* 基本情報 */}
                {/* ========================= */}

                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,

                    p: {
                      xs: 2,
                      sm: 3,
                    },

                    border:
                      "1px solid #e0e0e0",

                    borderRadius:
                      2,
                  }}
                >
                  <Typography
                    sx={{
                      mb: 2,

                      fontSize:
                        17,

                      fontWeight:
                        700,

                      color:
                        "#333333",
                    }}
                  >
                    基本情報
                  </Typography>

                  <Divider
                    sx={{
                      mb: 2.5,
                    }}
                  />

                  <Box
                    sx={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        {
                          xs:
                            "1fr",

                          sm:
                            "140px 1fr",
                        },

                      rowGap:
                        2,

                      columnGap:
                        3,
                    }}
                  >
                    {/* 発表者 */}

                    <Typography
                      sx={{
                        fontSize:
                          13,

                        fontWeight:
                          700,

                        color:
                          "text.secondary",
                      }}
                    >
                      発表者
                    </Typography>

                    <Typography
                      sx={{
                        fontSize:
                          14,

                        color:
                          "#333333",
                      }}
                    >
                      {presentation
                        .presenters
                        .length >
                      0
                        ? presentation
                            .presenters
                            .map(
                              (
                                presenter,
                              ) =>
                                presenter.student_number,
                            )
                            .join(
                              "、",
                            )
                        : "発表者なし"}
                    </Typography>

                    {/* ゼミ */}

                    <Typography
                      sx={{
                        fontSize:
                          13,

                        fontWeight:
                          700,

                        color:
                          "text.secondary",
                      }}
                    >
                      ゼミ名（教員名）
                    </Typography>

                    <Typography
                      sx={{
                        fontSize:
                          14,

                        color:
                          "#333333",
                      }}
                    >
                      {presentation.seminar_name ||
                        "未登録"}
                    </Typography>

                    {/* 登録日 */}

                    <Typography
                      sx={{
                        fontSize:
                          13,

                        fontWeight:
                          700,

                        color:
                          "text.secondary",
                      }}
                    >
                      登録日
                    </Typography>

                    <Typography
                      sx={{
                        fontSize:
                          14,

                        color:
                          "#333333",
                      }}
                    >
                      {new Date(
                        presentation.created_at,
                      ).toLocaleDateString(
                        "ja-JP",
                        {
                          year:
                            "numeric",

                          month:
                            "long",

                          day:
                            "numeric",
                        },
                      )}
                    </Typography>
                  </Box>
                </Paper>

                {/* ========================= */}
                {/* 発表概要 */}
                {/* ========================= */}

                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,

                    p: {
                      xs: 2,
                      sm: 3,
                    },

                    border:
                      "1px solid #e0e0e0",

                    borderRadius:
                      2,
                  }}
                >
                  <Typography
                    sx={{
                      mb: 2,

                      fontSize:
                        17,

                      fontWeight:
                        700,

                      color:
                        "#333333",
                    }}
                  >
                    発表概要
                  </Typography>

                  <Divider
                    sx={{
                      mb: 2.5,
                    }}
                  />

                  {presentation.summary ? (
                    <Box className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[
                          rehypeRaw,
                          rehypeSanitize
                        ]}
                      >
                        {presentation.summary}
                      </ReactMarkdown>
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        color:"text.secondary",
                        fontSize:14,
                      }}
                    >
                      発表概要は登録されていません。
                    </Typography>
                  )}
                </Paper>

                {/* ========================= */}
                {/* 関連リンク */}
                {/* ========================= */}

                <Paper
                  elevation={0}
                  sx={{
                    p: {
                      xs: 2,
                      sm: 3,
                    },

                    border:
                      "1px solid #e0e0e0",

                    borderRadius:
                      2,
                  }}
                >
                  <Typography
                    sx={{
                      mb: 2,

                      fontSize:
                        17,

                      fontWeight:
                        700,

                      color:
                        "#333333",
                    }}
                  >
                    関連リンク
                  </Typography>

                  <Divider
                    sx={{
                      mb: 2.5,
                    }}
                  />

                  <Box
                    sx={{
                      display:
                        "flex",

                      flexWrap:
                        "wrap",

                      gap: 1.5,
                    }}
                  >
                    {/* 発表資料 */}

                    {presentation.material_url && (
                      <Button
                        variant="outlined"
                        startIcon={
                          <Description />
                        }
                        endIcon={
                          <OpenInNew />
                        }
                        onClick={() => {
                          handleOpenUrl(
                            presentation.material_url!,
                          );
                        }}
                        sx={{
                          color:
                            "#172e5a",

                          borderColor:
                            "#172e5a",

                          fontWeight:
                            700,

                          textTransform:
                            "none",
                        }}
                      >
                        発表資料を開く
                      </Button>
                    )}

                    {/* GitHub */}

                    {presentation.github_url && (
                      <Button
                        variant="outlined"
                        startIcon={
                          <GitHub />
                        }
                        endIcon={
                          <OpenInNew />
                        }
                        onClick={() => {
                          handleOpenUrl(
                            presentation.github_url!,
                          );
                        }}
                        sx={{
                          color:
                            "#172e5a",

                          borderColor:
                            "#172e5a",

                          fontWeight:
                            700,

                          textTransform:
                            "none",
                        }}
                      >
                        GitHubを開く
                      </Button>
                    )}

                    {/* リンクなし */}

                    {!presentation.material_url &&
                      !presentation.github_url && (
                        <Typography
                          sx={{
                            color:
                              "text.secondary",

                            fontSize:
                              14,
                          }}
                        >
                          関連リンクは登録されていません。
                        </Typography>
                      )}
                  </Box>
                </Paper>
              </Box>
            )}
        </Box>
      </Box>
    </Box>
  );
}