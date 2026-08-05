import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#172e5a",
      dark: "#102447",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f7f8fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#777777",
    },
  },

  typography: {
    fontFamily:
      '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  },

  shape: {
    borderRadius: 6,
  },
});