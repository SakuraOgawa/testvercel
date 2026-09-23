import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

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

import { supabase } from "../lib/supabase";

import type {
  ProjectType,
} from "../types/presentationEvent";

type EventCreatePageProps = {
  session: Session;
};

type FormErrors = {
  name?: string;
  projectType?: string;
};

export default function EventCreatePage({
  session,
}: EventCreatePageProps) {
  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [
    projectType,
    setProjectType,
  ] = useState<ProjectType | "">("");

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
  ] = useState<FormErrors>({});

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const validate = () => {
    const newErrors: FormErrors = {};

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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const newErrors = validate();

    if (
      Object.keys(newErrors).length > 0
    ) {
      setErrors(newErrors);
      return;
    }

    if (!projectType) {
      return;
    }

    setErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("presentation_events")
        .insert({
          name: name.trim(),
          project_type: projectType,

          event_date:
            eventDate || null,

          location:
            location.trim() || null,

          created_by:
            session.user.id,
        });

      if (error) {
        throw error;
      }

      navigate("/events", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "発表会登録エラー:",
        error,
      );

      setSubmitError(
        "発表会の作成に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 720,
            mx: "auto",

            px: {
              xs: 2,
              md: 4,
            },

            py: 4,
          }}
        >
          <Typography
            component="h1"
            sx={{
              mb: 3,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            発表会を新規作成
          </Typography>

          <Typography
            sx={{
              mb: 0.7,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            発表会名
          </Typography>

          <TextField
            fullWidth
            size="small"
            value={name}
            placeholder="例）2026年度 4年卒業研究発表会"
            error={Boolean(errors.name)}
            helperText={errors.name}
            onChange={(event) => {
              setName(
                event.target.value,
              );

              setErrors((previous) => ({
                ...previous,
                name: undefined,
              }));
            }}
            sx={{ mb: 2 }}
          />

          <Typography
            sx={{
              mb: 0.7,
              fontSize: 13,
              fontWeight: 700,
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
            sx={{ mb: 2 }}
          >
            <Select
              displayEmpty
              value={projectType}
              onChange={(event) => {
                setProjectType(
                  event.target
                    .value as ProjectType,
                );

                setErrors(
                  (previous) => ({
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
                  color: "error.main",
                  fontSize: 12,
                }}
              >
                {errors.projectType}
              </Typography>
            )}
          </FormControl>

          <Typography
            sx={{
              mb: 0.7,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            開催日
          </Typography>

          <TextField
            fullWidth
            type="date"
            size="small"
            value={eventDate}
            onChange={(event) => {
              setEventDate(
                event.target.value,
              );
            }}
            sx={{ mb: 2 }}
          />

          <Typography
            sx={{
              mb: 0.7,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            開催場所
          </Typography>

          <TextField
            fullWidth
            size="small"
            value={location}
            placeholder="例）1号館 大講義室"
            onChange={(event) => {
              setLocation(
                event.target.value,
              );
            }}
          />

          {submitError && (
            <Typography
              sx={{
                mt: 2,
                color: "error.main",
                fontSize: 13,
              }}
            >
              {submitError}
            </Typography>
          )}

          <Box
            sx={{
              mt: 4,

              display: "flex",
              justifyContent:
                "flex-end",

              gap: 1.5,
            }}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                navigate("/events");
              }}
              disabled={isSubmitting}
              sx={{
                minWidth: 120,
                textTransform: "none",
              }}
            >
              キャンセル
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                minWidth: 140,

                bgcolor: "#172e5a",

                fontWeight: 700,

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