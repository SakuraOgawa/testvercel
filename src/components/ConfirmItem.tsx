import { Box, Typography } from "@mui/material";

type ConfirmItemProps = {
  label: string;
  value?: string;
  multiline?: boolean;
  isLink?: boolean;
};

export default function ConfirmItem({
  label,
  value,
  multiline = false,
  isLink = false,
}: ConfirmItemProps) {
  const displayValue =
    value?.trim() || "未入力";

  return (
    <Box
      sx={{
        py: 2,
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Typography
        sx={{
          mb: 0.8,
          color: "#666666",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      {isLink && value ? (
        <Typography
          component="a"
          href={value}
          target="_blank"
          rel="noreferrer"
          sx={{
            color: "#315eaa",
            fontSize: 14,
            overflowWrap: "anywhere",
            textDecoration: "underline",
          }}
        >
          {value}
        </Typography>
      ) : (
        <Typography
          sx={{
            color:
              displayValue === "未入力"
                ? "#999999"
                : "#333333",
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: multiline
              ? "pre-wrap"
              : "normal",
            overflowWrap: "anywhere",
          }}
        >
          {displayValue}
        </Typography>
      )}
    </Box>
  );
}