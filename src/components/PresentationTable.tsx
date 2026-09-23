import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { Presentation } from "../types/presentation";

type PresentationTableProps = {
  rows: Presentation[];

  // ページングしたときも番号を連番にするため
  startIndex: number;
};

const tableHeadCellStyle = {
  py: 1.3,
  px: 2,
  color: "#333333",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
  borderBottom: "1px solid #d8d8d8",
};

const tableBodyCellStyle = {
  py: 1.2,
  px: 2,
  color: "#333333",
  fontSize: 13,
  borderBottom: "1px solid #dddddd",
};

export default function PresentationTable({
  rows,
  startIndex,
}: PresentationTableProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 1,
        overflowX: "auto",
      }}
    >
      <Table
        size="small"
        sx={{
          minWidth: 760,
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              bgcolor: "#f0f1f3",
            }}
          >
            <TableCell sx={tableHeadCellStyle}>
              発表番号
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              タイトル
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              発表者
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              ゼミ名（教員名）
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              登録日
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  cursor: "pointer",

                  "&:last-child td": {
                    borderBottom: 0,
                  },
                }}
              >
                {/* DBには保存せず、ここで自動採番 */}
                <TableCell sx={tableBodyCellStyle}>
                  {startIndex + index + 1}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.title}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.presenters.length > 0 ? (
                    row.presenters
                    .map(
                      (presenter) =>
                        presenter.student_number,
                    )
                    .join("、")
                  ) : (
                    <Typography
                      component="span"
                      sx={{
                        color: "#999999",
                        fontSize: 13,
                      }}
                    >
                      発表者なし
                    </Typography>
                  )}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.seminar_name}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {new Date(
                    row.created_at,
                  ).toLocaleDateString(
                    "ja-JP",
                    {
                      month: "numeric",
                      day: "numeric",
                    },
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                align="center"
                sx={{
                  py: 6,
                  color: "text.secondary",
                }}
              >
                条件に一致する発表はありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}