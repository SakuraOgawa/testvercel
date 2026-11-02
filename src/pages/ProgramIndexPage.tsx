import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarMonth, ChevronRight } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import Sidebar, { drawerWidth } from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import type { PresentationEvent } from "../types/presentationEvent";

export default function ProgramIndexPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PresentationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.from("presentation_events").select("id,name,project_type,event_date,location,created_by,created_at").order("event_date", { ascending: false, nullsFirst: false }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError("発表会を読み込めませんでした。再読み込みしてください。");
      else setEvents((data ?? []) as PresentationEvent[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fa" }}><Sidebar /><Box component="main" sx={{ ml: { xs: 0, md: `${drawerWidth}px` }, p: { xs: 2, sm: 3, md: 5 }, pt: { xs: 8, md: 5 }, width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` } }}>
    <Stack direction="row" sx={{ gap: 2, alignItems: "center", mb: 1 }}><CalendarMonth color="primary" /><Typography variant="h4" sx={{ fontWeight: 700, color: "#172e5a" }}>発表プログラム</Typography></Stack>
    <Typography color="text.secondary" sx={{ mb: 3 }}>発表会を選ぶと、スケジュールの作成・閲覧ができます。</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <CircularProgress aria-label="発表会を読み込み中" /> : events.length === 0 ? <Paper sx={{ p: 4 }}><Typography>発表会がまだありません。</Typography><Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/events")}>発表会一覧へ</Button></Paper> : <Stack spacing={1.5}>{events.map((event) => <Paper key={event.id} variant="outlined" sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}><Box><Typography sx={{ fontWeight: 700, fontSize: 18 }}>{event.name}</Typography><Typography color="text.secondary" variant="body2">{event.event_date ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("ja-JP") : "日程未設定"} · {event.project_type === "third_year" ? "3年プロジェクト" : "4年プロジェクト"}</Typography></Box><Button variant="contained" endIcon={<ChevronRight />} onClick={() => navigate(`/events/${event.id}/program`)}>プログラムを開く</Button></Paper>)}</Stack>}
  </Box></Box>;
}
