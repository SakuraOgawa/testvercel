import {
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import { ExpandMore } from "@mui/icons-material";

type FilterSelectProps = {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
};

export default function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <FormControl
      size="small"
      sx={{
        width: {
          xs: "100%",
          lg: 180,
        },
        bgcolor: "#ffffff",
      }}
    >
      <Select<string>
        displayEmpty
        value={value}
        IconComponent={ExpandMore}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        renderValue={(selected) =>
          selected ? (
            selected
          ) : (
            <Typography
              component="span"
              sx={{
                color: "#999999",
                fontSize: 13,
              }}
            >
              {placeholder}
            </Typography>
          )
        }
        sx={{
          height: 40,
          borderRadius: 0,
          fontSize: 13,
          boxShadow: "0 2px 5px rgba(0,0,0,0.12)",

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d5d5d5",
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#b8b8b8",
          },
        }}
      >
        <MenuItem value="">
          <em>すべて</em>
        </MenuItem>

        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}