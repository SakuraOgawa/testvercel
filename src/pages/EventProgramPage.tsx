import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { ArrowDownward, ArrowUpward, Edit, Save } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, IconButton, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import Sidebar, { drawerWidth } from "../components/Sidebar";
import { useAuthContext } from "../hooks/useAuthContext";
import { supabase } from "../lib/supabase";

type Presentation = { id: string; title: string; seminar_name: string; presenters: { student_number: string }[] | null };
type Entry = { presentationId: string; names: string; chair: string; start: string; end: string };
type Program = { entries: Entry[]; revision: string };

export default function EventProgramPage() {
  const { eventId } = useParams();
  const { session, profile } = useAuthContext();
  const canEdit = Boolean(session?.user.id && profile?.id === session.user.id && (profile.role === "teacher" || profile.role === "admin"));
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [savedEntries, setSavedEntries] = useState<Entry[]>([]);
  const [revision, setRevision] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setEditing(false);
      setNotice("");
      try {
        const [event, talks, program] = await Promise.all([
          supabase.from("presentation_events").select("name").eq("id", eventId).single(),
          supabase.from("presentations").select("id,title,seminar_name,presenters(student_number)").eq("event_id", eventId).order("created_at").order("id"),
          supabase.from("event_programs").select("entries,revision").eq("event_id", eventId).maybeSingle(),
        ]);
        if (event.error || talks.error || program.error) throw new Error("プログラムを取得できませんでした。ページを再読み込みしてください。");
        if (cancelled) return;
        const rows = (talks.data ?? []) as Presentation[];
        const stored = program.data as Program | null;
        const ids = new Set(rows.map((row) => row.id));
        const ordered = (stored?.entries ?? []).filter((entry) => ids.has(entry.presentationId));
        const included = new Set(ordered.map((entry) => entry.presentationId));
        const merged = [...ordered, ...rows.filter((row) => !included.has(row.id)).map((row) => ({ presentationId: row.id, names: "", chair: "", start: "", end: "" }))];
        setPresentations(rows);
        setEntries(merged);
        setSavedEntries(merged);
        setRevision(stored?.revision ?? null);
        setEventName(event.data.name);
        if (!stored) setNotice("プログラムは未設定です。現在は登録順で表示しています。");
        else if (merged.length > ordered.length) setNotice("新しい発表を末尾に追加しています。時刻は未設定です。");
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "プログラムを取得できませんでした。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [eventId]);

  function change(index: number, field: keyof Omit<Entry, "presentationId">, value: string) {
    setEntries((current) => current.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }
  function move(index: number, offset: number) {
    setEntries((current) => {
      const result = [...current];
      const target = index + offset;
      if (target < 0 || target >= result.length) return current;
      [result[index], result[target]] = [result[target], result[index]];
      return result;
    });
  }
  async function save() {
    if (!canEdit || !editing || saving || !eventId) return;
    let previousEnd = "";
    for (const entry of entries) {
      if (Boolean(entry.start) !== Boolean(entry.end) || (entry.start && entry.end <= entry.start)) {
        setError("開始・終了時刻を両方入力し、終了時刻を開始時刻より後にしてください。");
        return;
      }
      if (entry.start && previousEnd && entry.start < previousEnd) {
        setError("発表順に合わせて、時刻が重ならないように入力してください。");
        return;
      }
      if (entry.end) previousEnd = entry.end;
    }
    setSaving(true);
    setError("");
    try {
      const nextRevision = crypto.randomUUID();
      const payload = { event_id: eventId, entries, revision: nextRevision };
      const result = revision
        ? await supabase.from("event_programs").update(payload).eq("event_id", eventId).eq("revision", revision).select("revision").maybeSingle()
        : await supabase.from("event_programs").insert(payload).select("revision").single();
      if (result.error || !result.data) throw new Error(result.error?.code === "23505" || (!result.error && !result.data)
        ? "他のユーザーが更新しました。ページを再読み込みして最新の内容を確認してください。"
        : "保存できませんでした。編集権限と接続を確認し、再度保存してください。");
      setRevision(result.data.revision);
      setSavedEntries(entries);
      setEditing(false);
      setNotice("プログラムを保存しました。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存できませんでした。");
    } finally { setSaving(false); }
  }
  const editable = canEdit && editing;
  const byId = new Map(presentations.map((talk) => [talk.id, talk]));

  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fa" }}>
    <Sidebar />
    <Box component="main" sx={{ ml: `${drawerWidth}px`, p: { xs: 3, md: 5 }, width: `calc(100% - ${drawerWidth}px)` }}>
      <Typography variant="overline" color="text.secondary">{eventName}</Typography>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 700, color: "#172e5a" }}>発表プログラム</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>発表順と当日のタイムテーブル</Typography></Box>
        {canEdit && !loading && !error && !editing && <Button variant="contained" startIcon={<Edit />} onClick={() => { setEditing(true); setNotice(""); }}>プログラムを編集</Button>}
        {editable && <Stack direction="row" sx={{ gap: 1 }}><Button disabled={saving} onClick={() => { setEntries(savedEntries); setEditing(false); setError(""); }}>キャンセル</Button><Button variant="contained" disabled={saving} startIcon={<Save />} onClick={() => void save()}>{saving ? "保存中…" : "保存"}</Button></Stack>}
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="info" sx={{ mb: 2 }}>{notice}</Alert>}
      {loading ? <CircularProgress aria-label="プログラムを読み込み中" /> : !presentations.length ? <Paper sx={{ p: 5 }}><Typography>登録されている発表はありません。</Typography></Paper> : <>
        {editable && <Alert severity="info" sx={{ mb: 2 }}>矢印で発表順を変更できます。座長・時刻を入力して保存してください。未定の時刻は空欄で保存できます。</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 1000 }} aria-label="発表プログラム">
            <TableHead sx={{ bgcolor: "#eaf0fa" }}><TableRow>{["No.", "学籍番号", "ゼミ", "座長", "タイトル", "開始時刻", "終了時刻", ...(editable ? ["発表順"] : [])].map((label) => <TableCell key={label} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>{entries.map((entry, index) => {
              const talk = byId.get(entry.presentationId)!;
              return <TableRow key={entry.presentationId} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#fafbfd" } }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ whiteSpace: "pre-line" }}>{talk.presenters?.map((p) => p.student_number).join("\n") || "—"}</TableCell>
                <TableCell>{talk.seminar_name}</TableCell>
                <TableCell>{editable ? <TextField disabled={saving} size="small" value={entry.chair} onChange={(e) => change(index, "chair", e.target.value)} slotProps={{ htmlInput: { "aria-label": `${index + 1}番の座長` } }} sx={{ width: 140 }} /> : entry.chair || "—"}</TableCell>
                <TableCell sx={{ minWidth: 250 }}><Link component={RouterLink} to={`/events/${eventId}/presentations/${talk.id}`} underline="hover">{talk.title}</Link></TableCell>
                {(["start", "end"] as const).map((field) => <TableCell key={field}>{editable ? <TextField disabled={saving} type="time" size="small" value={entry[field]} onChange={(e) => change(index, field, e.target.value)} slotProps={{ htmlInput: { "aria-label": `${index + 1}番の${field === "start" ? "開始" : "終了"}時刻` } }} /> : entry[field] || "未定"}</TableCell>)}
                {editable && <TableCell sx={{ whiteSpace: "nowrap" }}><IconButton aria-label={`${index + 1}番を上へ`} disabled={saving || index === 0} onClick={() => move(index, -1)}><ArrowUpward /></IconButton><IconButton aria-label={`${index + 1}番を下へ`} disabled={saving || index === entries.length - 1} onClick={() => move(index, 1)}><ArrowDownward /></IconButton></TableCell>}
              </TableRow>;
            })}</TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  </Box>;
}
