import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar, {
  drawerWidth,
} from "../components/Sidebar";

import {
  useAuthContext,
} from "../hooks/useAuthContext";

import {
  supabase,
} from "../lib/supabase";

import type {
  ProjectType,
} from "../types/presentationEvent";

/*
 * ========================================
 * 型
 * ========================================
 */

type FormErrors = {
  name?: string;
  projectType?: string;
};

/*
 * ========================================
 * EventCreatePage
 * ========================================
 */

export default function EventCreatePage() {
  const navigate =
    useNavigate();

  /*
   * ========================================
   * AuthContext
   * ========================================
   *
   * created_byにログインユーザーの
   * UUIDを保存するためsessionを使用する。
   */

  const {
    session,
  } = useAuthContext();

  /*
   * ========================================
   * State
   * ========================================
   */

  const [
    name,
    setName,
  ] = useState("");

  const [
    projectType,
    setProjectType,
  ] = useState<
    ProjectType | ""
  >("");

  const [
    eventDate,
    setEventDate,
  ] = useState("");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    errors,
    setErrors,
  ] = useState<FormErrors>(
    {},
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  /*
   * ========================================
   * Validation
   * ========================================
   */

  const validate = () => {
    const newErrors:
      FormErrors = {};

    if (!name.trim()) {
      newErrors.name =
        "発表会名を入力してください。";
    }

    if (!projectType) {
      newErrors.projectType =
        "プロジェクト区分を選択してください。";
    }

    return newErrors;
  };

  /*
   * ========================================
   * 発表会作成
   * ========================================
   */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      /*
       * ========================================
       * Session確認
       * ========================================
       */

      if (!session) {
        setSubmitError(
          "ログイン情報を取得できませんでした。",
        );

        return;
      }

      /*
       * ========================================
       * Validation
       * ========================================
       */

      const newErrors =
        validate();

      if (
        Object.keys(
          newErrors,
        ).length > 0
      ) {
        setErrors(
          newErrors,
        );

        return;
      }

      /*
       * TypeScriptに
       * projectTypeが空ではないことを
       * 認識させる。
       */

      if (!projectType) {
        return;
      }

      setErrors({});

      setSubmitError("");

      setIsSubmitting(
        true,
      );

      /*
       * ========================================
       * INSERT
       * ========================================
       */

      try {
        const {
          error,
        } = await supabase
          .from(
            "presentation_events",
          )
          .insert({
            name:
              name.trim(),

            project_type:
              projectType,

            event_date:
              eventDate ||
              null,

            location:
              location.trim() ||
              null,

            created_by:
              session.user.id,
          });

        if (error) {
          throw error;
        }

        /*
         * ========================================
         * 作成完了
         * ========================================
         */

        navigate(
          "/events",
          {
            replace: true,
          },
        );
      } catch (
        error
      ) {
        console.error(
          "発表会登録エラー:",
          error,
        );

        setSubmitError(
          "発表会の作成に失敗しました。",
        );
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };

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
          component="form"
          onSubmit={
            handleSubmit
          }
          sx={{
            width:
              "100%",

            maxWidth:
              720,

            mx: "auto",

            px: {
              xs: 2,
              md: 4,
            },

            py: 4,
          }}
        >
          {/* ================================= */}
          {/* Title */}
          {/* ================================= */}

          <Typography
            component="h1"
            sx={{
              mb: 3,

              fontSize:
                22,

              fontWeight:
                700,

              color:
                "#333333",
            }}
          >
            発表会を新規作成
          </Typography>

          {/* ================================= */}
          {/* 発表会名 */}
          {/* ================================= */}

          <Typography
            sx={{
              mb: 0.7,

              fontSize:
                13,

              fontWeight:
                700,
            }}
          >
            発表会名
          </Typography>

          <TextField
            fullWidth
            size="small"
            value={name}
            placeholder="例）2026年度 4年卒業研究発表会"
            error={Boolean(
              errors.name,
            )}
            helperText={
              errors.name
            }
            onChange={(
              event,
            ) => {
              setName(
                event.target
                  .value,
              );

              setErrors(
                (
                  previous,
                ) => ({
                  ...previous,

                  name:
                    undefined,
                }),
              );
            }}
            sx={{
              mb: 2,
            }}
          />

          {/* ================================= */}
          {/* プロジェクト区分 */}
          {/* ================================= */}

          <Typography
            sx={{
              mb: 0.7,

              fontSize:
                13,

              fontWeight:
                700,
            }}
          >
            プロジェクト区分
          </Typography>

          <FormControl
            fullWidth
            size="small"
            error={Boolean(
              errors.projectType,
            )}
            sx={{
              mb: 2,
            }}
          >
            <Select
              displayEmpty
              value={
                projectType
              }
              onChange={(
                event,
              ) => {
                setProjectType(
                  event.target
                    .value as
                    ProjectType,
                );

                setErrors(
                  (
                    previous,
                  ) => ({
                    ...previous,

                    projectType:
                      undefined,
                  }),
                );
              }}
            >
              <MenuItem value="">
                <em>
                  選択してください
                </em>
              </MenuItem>

              <MenuItem value="third_year">
                3年プロジェクト
              </MenuItem>

              <MenuItem value="fourth_year">
                4年プロジェクト
              </MenuItem>
            </Select>

            {errors.projectType && (
              <Typography
                sx={{
                  mt: 0.5,

                  color:
                    "error.main",

                  fontSize:
                    12,
                }}
              >
                {
                  errors.projectType
                }
              </Typography>
            )}
          </FormControl>

          {/* ================================= */}
          {/* 開催日 */}
          {/* ================================= */}

          <Typography
            sx={{
              mb: 0.7,

              fontSize:
                13,

              fontWeight:
                700,
            }}
          >
            開催日
          </Typography>

          <TextField
            fullWidth
            type="date"
            size="small"
            value={
              eventDate
            }
            onChange={(
              event,
            ) => {
              setEventDate(
                event.target
                  .value,
              );
            }}
            sx={{
              mb: 2,
            }}
          />

          {/* ================================= */}
          {/* 開催場所 */}
          {/* ================================= */}

          <Typography
            sx={{
              mb: 0.7,

              fontSize:
                13,

              fontWeight:
                700,
            }}
          >
            開催場所
          </Typography>

          <TextField
            fullWidth
            size="small"
            value={
              location
            }
            placeholder="例）1号館 大講義室"
            onChange={(
              event,
            ) => {
              setLocation(
                event.target
                  .value,
              );
            }}
          />

          {/* ================================= */}
          {/* Submit Error */}
          {/* ================================= */}

          {submitError && (
            <Typography
              sx={{
                mt: 2,

                color:
                  "error.main",

                fontSize:
                  13,
              }}
            >
              {submitError}
            </Typography>
          )}

          {/* ================================= */}
          {/* Buttons */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 4,

              display:
                "flex",

              justifyContent:
                "flex-end",

              gap: 1.5,
            }}
          >
            <Button
              type="button"
              variant="outlined"
              disabled={
                isSubmitting
              }
              onClick={() => {
                navigate(
                  "/events",
                );
              }}
              sx={{
                minWidth:
                  120,

                textTransform:
                  "none",
              }}
            >
              キャンセル
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                isSubmitting ||
                !session
              }
              sx={{
                minWidth:
                  140,

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
              {isSubmitting
                ? "作成中..."
                : "作成する"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}