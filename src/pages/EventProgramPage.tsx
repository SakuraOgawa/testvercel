import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Add, Download, Edit, Save, DragIndicator, DeleteOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, IconButton, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import Sidebar, { drawerWidth } from "../components/Sidebar";
import { useAuthContext } from "../hooks/useAuthContext";
import { supabase } from "../lib/supabase";

type Presentation = { id: string; title: string; seminar_name: string; presenters: { student_number: string }[] | null };
type Entry = { presentationId: string; names: string; chair: string; start: string; end: string; duration: number; separateFromSeminar?: boolean; kind?: "talk" | "break"; label?: string };
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
  const [dragging, setDragging] = useState<string | null>(null);
  const [draggingSeminar, setDraggingSeminar] = useState<string | null>(null);
  const [live, setLive] = useState(true);

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
        const ordered = (stored?.entries ?? []).filter((entry) => entry.kind === "break" || ids.has(entry.presentationId));
        const included = new Set(ordered.filter((entry) => entry.kind !== "break").map((entry) => entry.presentationId));
        const merged = [...ordered, ...rows.filter((row) => !included.has(row.id)).map((row) => ({ presentationId: row.id, names: "", chair: "", start: "", end: "", duration: 15 }))];
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

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase.channel(`event-program-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_programs", filter: `event_id=eq.${eventId}` }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const stored = payload.new as Program;
        setEntries((current) => {
          if (editing) return current;
          setSavedEntries(stored.entries ?? []);
          setRevision(stored.revision ?? null);
          setNotice("別のユーザーがプログラムを更新しました。");
          return stored.entries ?? current;
        });
      }).subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => { void supabase.removeChannel(channel); };
  }, [eventId, editing]);

  function timeToMinutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }
  function minutesToTime(value: number) {
    const normalized = ((value % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
  }
  function updateSchedule(current: Entry[], index: number, field: "start" | "end" | "duration", value: string) {
    const next = current.map((entry) => ({ ...entry }));
    const entry = next[index];
    if (!entry) return current;
    if (field === "start") {
      entry.start = value;
      if (!value) return next;
      let cursor = timeToMinutes(value);
      for (let i = index; i < next.length; i += 1) {
        const item = next[i];
        if (i > index) item.start = minutesToTime(cursor);
        item.duration = Math.max(1, Number(item.duration) || (item.kind === "break" ? 10 : 15));
        cursor = timeToMinutes(item.start) + item.duration;
        item.end = minutesToTime(cursor);
      }
      return next;
    }
    if (field === "duration") {
      if (value === "") { entry.duration = 1; return next; }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 1) return current;
      entry.duration = Math.floor(parsed);
      if (entry.start) {
        entry.end = minutesToTime(timeToMinutes(entry.start) + entry.duration);
        let cursor = timeToMinutes(entry.end);
        for (let i = index + 1; i < next.length; i += 1) {
          const item = next[i]; item.start = minutesToTime(cursor);
          item.duration = Math.max(1, Number(item.duration) || (item.kind === "break" ? 10 : 15));
          cursor = timeToMinutes(item.start) + item.duration; item.end = minutesToTime(cursor);
        }
      }
      return next;
    }
    entry.end = value;
    if (entry.start && value) entry.duration = Math.max(1, timeToMinutes(value) - timeToMinutes(entry.start));
    return next;
  }
  function change(index: number, field: keyof Omit<Entry, "presentationId">, value: string) {
    if (field === "start" || field === "end" || field === "duration") {
      setEntries((current) => updateSchedule(current, index, field, value));
      return;
    }
    setEntries((current) => current.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }
  const byId = new Map(presentations.map((talk) => [talk.id, talk]));
  const baseSeminarName = (entry: Entry) => byId.get(entry.presentationId)?.seminar_name?.trim() || "ゼミ未設定";
  const seminarKey = (entry: Entry) => entry.separateFromSeminar ? `個別発表:${entry.presentationId}` : baseSeminarName(entry);
  const seminarLabel = (entry: Entry) => entry.separateFromSeminar ? `${baseSeminarName(entry)}（個別発表）` : baseSeminarName(entry);
  const seminarGroups = () => {
    const groups: { key: string; entries: Entry[] }[] = [];
    const bySeminar = new Map<string, Entry[]>();
    const order: string[] = [];
    for (const entry of entries) {
      if (entry.kind === "break") { order.push(entry.presentationId); groups.push({ key: entry.presentationId, entries: [entry] }); continue; }
      const key = seminarKey(entry);
      if (!bySeminar.has(key)) { bySeminar.set(key, []); order.push(key); }
      bySeminar.get(key)!.push(entry);
    }
    const seminarGroups = new Map<string, { key: string; entries: Entry[] }>();
    for (const [key, talks] of bySeminar) seminarGroups.set(key, { key, entries: talks });
    const breakGroups = new Map(groups.map((group) => [group.key, group]));
    return order.map((key) => seminarGroups.get(key) ?? breakGroups.get(key)!).filter(Boolean);
  };
  function dropEntryOn(targetId: string) {
    if (!dragging || dragging === targetId) return;
    setEntries((current) => {
      const from = current.findIndex((entry) => entry.presentationId === dragging);
      const to = current.findIndex((entry) => entry.presentationId === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      const target = next.find((entry) => entry.presentationId === targetId);
      const moved = item.kind === "break" || !target || target.kind === "break"
        ? item
        : { ...item, separateFromSeminar: seminarKey(target) === baseSeminarName(item) ? false : true };
      next.splice(Math.min(to, next.length), 0, moved);
      return next;
    });
    setDragging(null);
  }
  function reorderSeminarGroups(source: string, target: string) {
    if (!source || source === target) return;
    setEntries((current) => {
      const groups: { key: string; entries: Entry[] }[] = [];
      const bySeminar = new Map<string, Entry[]>();
      const order: string[] = [];
      for (const entry of current) {
        if (entry.kind === "break") { order.push(entry.presentationId); groups.push({ key: entry.presentationId, entries: [entry] }); continue; }
        const key = seminarKey(entry);
        if (!bySeminar.has(key)) { bySeminar.set(key, []); order.push(key); }
        bySeminar.get(key)!.push(entry);
      }
      const moving = order.indexOf(source);
      const destination = order.indexOf(target);
      if (moving < 0 || destination < 0) return current;
      order.splice(moving, 1);
      order.splice(destination, 0, source);
      const breaks = new Map(groups.map((group) => [group.key, group.entries]));
      const reordered = order.flatMap((key) => bySeminar.get(key) ?? breaks.get(key) ?? []);
      const startEntry = reordered.find((entry) => entry.start);
      if (!startEntry) return reordered;
      let cursor = timeToMinutes(startEntry.start);
      const firstTimedIndex = reordered.indexOf(startEntry);
      for (let i = firstTimedIndex; i < reordered.length; i += 1) {
        const item = reordered[i]; item.start = minutesToTime(cursor);
        item.duration = Math.max(1, Number(item.duration) || (item.kind === "break" ? 10 : 15));
        cursor = timeToMinutes(item.start) + item.duration; item.end = minutesToTime(cursor);
      }
      return reordered;
    });
    setDraggingSeminar(null);
  }
  function insertBreak(kind: "lunch" | "toilet") {
    const label = kind === "lunch" ? "昼休み" : "トイレ休憩";
    setEntries((current) => [...current, { presentationId: `break-${crypto.randomUUID()}`, names: "", chair: "", start: "", end: "", duration: 10, kind: "break", label }]);
  }
  function downloadCsv() {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [["順番", "区分", "学籍番号", "ゼミ", "座長", "発表タイトル/休憩", "開始", "終了", "所要時間(分)"], ...entries.map((entry, index) => {
      const talk = byId.get(entry.presentationId);
      return [String(index + 1), entry.kind === "break" ? "休憩" : "発表", talk?.presenters?.map((p) => p.student_number).join(" / ") ?? "", talk?.seminar_name ?? "", entry.chair, entry.kind === "break" ? entry.label ?? "休憩" : talk?.title ?? "", entry.start, entry.end, String(entry.duration)];
    })];
    const csv = "\uFEFF" + lines.map((line) => line.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${eventName || "発表"}-program.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function save() {
    if (!canEdit || !editing || saving || !eventId) return;
    let previousEnd = "";
    for (const entry of entries) {
      if (!Number.isFinite(entry.duration) || entry.duration < 1) { setError("所要時間は1分以上で入力してください。"); return; }
      if (Boolean(entry.start) !== Boolean(entry.end) || (entry.start && timeToMinutes(entry.end) <= timeToMinutes(entry.start))) {
        setError("開始・終了時刻を両方入力し、終了時刻を開始時刻より後にしてください。");
        return;
      }
      if (entry.start && previousEnd && timeToMinutes(entry.start) < timeToMinutes(previousEnd)) {
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

  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fa" }}>
    <Sidebar />
    <Box component="main" sx={{ ml: { xs: 0, md: `${drawerWidth}px` }, p: { xs: 2, sm: 3, md: 5 }, pt: { xs: 8, md: 5 }, width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` } }}>
      <Typography variant="overline" color="text.secondary">{eventName}</Typography>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 700, color: "#172e5a" }}>発表プログラム</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>発表順と当日のタイムテーブル</Typography><Typography variant="caption" color={live ? "success.main" : "text.secondary"}>{live ? "● リアルタイム同期中" : "○ 再接続中"}</Typography></Box>
        {!loading && !error && <Button variant="outlined" startIcon={<Download />} onClick={downloadCsv}>CSVを書き出す</Button>}{canEdit && !loading && !error && !editing && <Button variant="contained" startIcon={<Edit />} onClick={() => { setEditing(true); setNotice(""); }}>プログラムを編集</Button>}
        {editable && <Stack direction="row" sx={{ gap: 1 }}><Button disabled={saving} onClick={() => { setEntries(savedEntries); setEditing(false); setError(""); }}>キャンセル</Button><Button variant="contained" disabled={saving} startIcon={<Save />} onClick={() => void save()}>{saving ? "保存中…" : "保存"}</Button></Stack>}
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="info" sx={{ mb: 2 }}>{notice}</Alert>}
      {loading ? <CircularProgress aria-label="プログラムを読み込み中" /> : !presentations.length ? <Paper sx={{ p: 5 }}><Typography>登録されている発表はありません。</Typography></Paper> : <>
        {editable && <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}><Button variant="outlined" startIcon={<Add />} onClick={() => insertBreak("toilet")}>トイレ休憩を追加</Button><Button variant="outlined" startIcon={<Add />} onClick={() => insertBreak("lunch")}>昼休みを追加</Button><Alert severity="info" sx={{ flexGrow: 1 }}>発表と休憩はドラッグして順番を変更できます。同じゼミの発表行や見出しへドロップするとゼミのまとまりに結合します。</Alert></Stack>}
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 1000 }} aria-label="発表プログラム">
            <TableHead sx={{ bgcolor: "#eaf0fa" }}><TableRow>{["No.", "学籍番号", "ゼミ", "座長", "タイトル", "開始時刻", "終了時刻", "所要時間", ...(editable ? ["発表順"] : [])].map((label) => <TableCell key={label} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>{seminarGroups().flatMap((group) => [<TableRow key={`group-${group.key}`} draggable={editable && group.entries[0].kind !== "break"} onDragStart={(event) => { setDraggingSeminar(group.key); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDraggingSeminar(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={() => { if (draggingSeminar) reorderSeminarGroups(draggingSeminar, group.key); else if (dragging) { setEntries((current) => { const from = current.findIndex((item) => item.presentationId === dragging); if (from < 0) return current; const next = [...current]; const [item] = next.splice(from, 1); const targetIndex = next.findIndex((candidate) => candidate.kind !== "break" && seminarKey(candidate) === group.key); if (item.kind === "break") { next.splice(targetIndex < 0 ? next.length : targetIndex, 0, item); } else { const sameSeminar = group.key === baseSeminarName(item); next.splice(targetIndex < 0 ? next.length : targetIndex, 0, { ...item, separateFromSeminar: !sameSeminar }); } return next; }); setDragging(null); } }} sx={{ bgcolor: draggingSeminar === group.key ? "#dfe8f6" : "#eef3fb", cursor: editable && group.entries[0].kind !== "break" ? "grab" : "default", outline: "none", boxShadow: draggingSeminar && draggingSeminar !== group.key ? "0 8px 22px rgba(23,46,90,0.28), inset 0 0 0 2px rgba(23,46,90,0.28)" : "none", transform: draggingSeminar && draggingSeminar !== group.key ? "translateY(-2px)" : "none", transition: "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease" }}><TableCell colSpan={editable ? 9 : 8} sx={{ fontWeight: 700, color: "#172e5a" }}>{group.entries[0].kind === "break" ? group.entries[0].label : `${seminarLabel(group.entries[0])}（${group.entries.length}件）`}{editable && group.entries[0].kind !== "break" && <><span>⋮⋮ ゼミ単位で移動・発表行をここへドロップすると個別配置</span></>}</TableCell></TableRow>, ...group.entries.map((entry) => {
              const index = entries.indexOf(entry);
              const talk = byId.get(entry.presentationId);
              return <TableRow key={entry.presentationId} hover draggable={editable} onDragStart={(event) => { setDragging(entry.presentationId); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragging(null)} onDragOver={(event) => { if (editable) event.preventDefault(); }} onDrop={() => dropEntryOn(entry.presentationId)} sx={{ "&:nth-of-type(even)": { bgcolor: "#fafbfd" }, opacity: dragging === entry.presentationId ? 0.45 : 1, cursor: editable ? "grab" : "default" }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ whiteSpace: "pre-line" }}>{talk?.presenters?.map((p) => p.student_number).join("\n") || (entry.kind === "break" ? "—" : "—")}</TableCell>
                <TableCell sx={{ whiteSpace: entry.kind === "break" ? "nowrap" : "normal", minWidth: entry.kind === "break" ? 130 : undefined }}>{entry.kind === "break" ? <Typography sx={{ fontWeight: 700, writingMode: "horizontal-tb", whiteSpace: "nowrap" }} color="primary">{entry.label}</Typography> : baseSeminarName(entry)}</TableCell>
                <TableCell>{editable && entry.kind !== "break" ? <TextField disabled={saving} size="small" value={entry.chair} onChange={(e) => change(index, "chair", e.target.value)} slotProps={{ htmlInput: { "aria-label": `${index + 1}番の座長` } }} sx={{ width: 140 }} /> : entry.chair || "—"}</TableCell>
                <TableCell sx={{ minWidth: 250 }}>{entry.kind === "break" ? <Typography sx={{ fontWeight: 700, writingMode: "horizontal-tb", whiteSpace: "nowrap" }}>{entry.label}</Typography> : <>{talk && <Link component={RouterLink} to={`/events/${eventId}/presentations/${talk.id}`} underline="hover">{talk.title}</Link>}</>}</TableCell>
                {(["start", "end"] as const).map((field) => <TableCell key={field}>{editable ? <TextField disabled={saving} type="time" size="small" value={entry[field]} onChange={(e) => change(index, field, e.target.value)} slotProps={{ htmlInput: { "aria-label": `${index + 1}番の${field === "start" ? "開始" : "終了"}時刻` } }} /> : entry[field] || "未定"}</TableCell>)}<TableCell>{editable ? <TextField disabled={saving} type="number" size="small" value={entry.duration} onChange={(e) => change(index, "duration", e.target.value)} slotProps={{ htmlInput: { min: 1, step: 1, "aria-label": `${index + 1}番の所要時間（分）` } }} sx={{ width: 100 }} /> : `${entry.duration}分`}</TableCell>
                {editable && <TableCell sx={{ whiteSpace: "nowrap" }}><IconButton aria-label="ドラッグして移動" size="small"><DragIndicator /></IconButton>{entry.kind === "break" && <IconButton aria-label="休憩を削除" onClick={() => setEntries((current) => current.filter((item) => item.presentationId !== entry.presentationId))}><DeleteOutlined /></IconButton>}</TableCell>}
              </TableRow>;
            })])}</TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  </Box>;
}
