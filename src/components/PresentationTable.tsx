import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import type { Presentation } from "../types/Presentation";

type PresentationTableProps = {
  rows: Presentation[];
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
  whiteSpace: "nowrap",
  borderBottom: "1px solid #dddddd",
};

export default function PresentationTable({
  rows,
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
          minWidth: 850,
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: "#f0f1f3" }}>
            <TableCell sx={tableHeadCellStyle}>
              発表番号
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              タイトル
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              氏名
            </TableCell>

            <TableCell sx={tableHeadCellStyle}>
              学籍番号
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
            rows.map((row) => (
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
                <TableCell sx={tableBodyCellStyle}>
                  {row.presentationNumber}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.title}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.studentName}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.studentNumber}
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.seminarName}（{row.teacherName}）
                </TableCell>

                <TableCell sx={tableBodyCellStyle}>
                  {row.registeredDate}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
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