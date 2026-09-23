import {
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";

import type {
  PresentationEvent,
} from "../types/presentationEvent";

type EventCardProps = {
  event: PresentationEvent;
  onClick: () => void;
};

export default function EventCard({
  event,
  onClick,
}: EventCardProps) {
  const projectTypeLabel =
    event.project_type === "third_year"
      ? "3年プロジェクト"
      : "4年プロジェクト";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid #dddddd",
        borderRadius: 2,
        bgcolor: "#ffffff",

        "&:hover": {
          borderColor: "#172e5a",
        },
      }}
    >
      <Typography
        sx={{
          mb: 1,
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        {event.name}
      </Typography>

      <Typography
        sx={{
          mb: 0.7,
          color: "#172e5a",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {projectTypeLabel}
      </Typography>

      <Box
        sx={{
          mb: 2,
          color: "text.secondary",
        }}
      >
        <Typography
          sx={{ fontSize: 13 }}
        >
          開催日：
          {event.event_date
            ? new Date(
                event.event_date,
              ).toLocaleDateString(
                "ja-JP",
              )
            : "未設定"}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 13,
          }}
        >
          開催場所：
          {event.location || "未設定"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="contained"
          onClick={onClick}
          sx={{
            bgcolor: "#172e5a",
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              bgcolor: "#102447",
            },
          }}
        >
          選択する
        </Button>
      </Box>
    </Paper>
  );
}