// Admin panel — 4 tabs: Overview, Courses, Users, Access & Subscriptions.
// Server-side admin check via has_role RPC (mirrors useIsAdmin).
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Trophy, Sparkles, Award, Plus, Pencil, Trash2, Eye, EyeOff,
  Search, ShieldCheck, Crown, Calendar, Loader2, BookOpen, KeyRound,
  FileSpreadsheet, Upload, Download, AlertCircle, TrendingUp, TrendingDown,
  Zap, Flame, Gift, Star, Webhook, RefreshCw, FlaskConical, GraduationCap,
  ExternalLink, Check, X as XIcon, Mail, MessageCircle, Phone,
  SlidersHorizontal, ChevronUp, ChevronDown, ArrowUpDown,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, Cell } from "recharts";
import { rankImg } from "@/lib/rankImages";

const RANK_ORDER = [
  "Prata I", "Prata II", "Prata III",
  "Ouro I", "Ouro II", "Ouro III",
  "AK I", "AK II", "AK Cruzada",
  "Xerife", "Águia I", "Águia II",
  "Supremo", "Global",
];

const RANK_TIER_COLOR: Record<string, string> = {
  "Prata I": "hsl(0 0% 75%)", "Prata II": "hsl(0 0% 78%)", "Prata III": "hsl(0 0% 82%)",
  "Ouro I": "hsl(45 90% 55%)", "Ouro II": "hsl(45 95% 58%)", "Ouro III": "hsl(45 100% 62%)",
  "AK I": "hsl(20 90% 55%)", "AK II": "hsl(20 95% 58%)", "AK Cruzada": "hsl(15 95% 60%)",
  "Xerife": "hsl(280 80% 60%)", "Águia I": "hsl(200 90% 60%)", "Águia II": "hsl(200 95% 65%)",
  "Supremo": "hsl(139 80% 50%)", "Global": "hsl(50 100% 60%)",
};

const PLAN_STYLES: Record<string, { label: string; cls: string }> = {
  free:      { label: "Free",      cls: "bg-muted text-muted-foreground border-border" },
  pro:       { label: "Pro",       cls: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
  elite:     { label: "Elite",     cls: "bg-purple-500/15 text-purple-300 border-purple-500/40" },
  vitalicio: { label: "Vitalício", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  vip:       { label: "VIP",       cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  panda_video_id: string;
  thumbnail_url: string | null;
  module: string | null;
  ordem: number | null;
  published: boolean;
  created_at: string;
};

type XPRow = {
  user_id: string;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  display_name: string | null;
  last_login_date: string | null;
};

type AuthUserRow = {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

type AccessRow = {
  user_id: string;
  plan: string;
  access_expires_at: string | null;
  notes: string | null;
};

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");
const fmtDateTime = (s: string | null) => (s ? new Date(s).toLocaleString("pt-BR") : "—");

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/dashboard", { replace: true });
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0d0d14] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="relative mb-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#14141f] via-[#0f0f18] to-[#0d0d14] px-5 py-5 sm:px-7 sm:py-6">
          {/* glows decorativos */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-gradient-to-br from-primary/25 to-primary/5 shadow-[0_0_24px_hsl(var(--primary)/0.35)]">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-2xl font-extrabold uppercase tracking-wider text-transparent sm:text-3xl">
                Painel Admin
              </h1>
              <p className="text-sm text-muted-foreground">Controle total da plataforma IA Vingativa</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="overview" className="gap-2"><Sparkles className="h-4 w-4" />Visão Geral</TabsTrigger>
            <TabsTrigger value="gamification" className="gap-2"><Zap className="h-4 w-4" />Gamificação</TabsTrigger>
            <TabsTrigger value="courses" className="gap-2"><BookOpen className="h-4 w-4" />Aulas</TabsTrigger>
            <TabsTrigger value="crm" className="gap-2"><FileSpreadsheet className="h-4 w-4" />Relatórios & CRM</TabsTrigger>
            <TabsTrigger value="cakto" className="gap-2"><Webhook className="h-4 w-4" />Vendas</TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-2"><FlaskConical className="h-4 w-4" />Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
          <TabsContent value="gamification" className="mt-6"><GamificationTab /></TabsContent>
          <TabsContent value="courses" className="mt-6"><CoursesTab /></TabsContent>

          <TabsContent value="crm" className="mt-6"><CRMTab /></TabsContent>
          <TabsContent value="cakto" className="mt-6"><CaktoTab /></TabsContent>
          <TabsContent value="auditoria" className="mt-6"><AuditoriaTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

/* ================== TAB 1: OVERVIEW ================== */
const OverviewTab = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, totalXp: 0, ranksCount: 0 });
  const [rankDist, setRankDist] = useState<{ rank: string; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<XPRow[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, xpRes] = await Promise.all([
        supabase.rpc("admin_user_stats"),
        supabase.from("user_xp")
          .select("user_id, total_xp, current_rank, streak_days, display_name, last_login_date")
          .order("total_xp", { ascending: false })
          ,
      ]);

      const xp = (xpRes.data ?? []) as XPRow[];
      const totalXp = xp.reduce((s, r) => s + (r.total_xp ?? 0), 0);
      const distMap = new Map<string, number>();
      xp.forEach(r => distMap.set(r.current_rank, (distMap.get(r.current_rank) ?? 0) + 1));
      const dist = RANK_ORDER
        .map(r => ({ rank: r, count: distMap.get(r) ?? 0 }))
        .filter(d => d.count > 0);

      const s = statsRes.data?.[0];
      setStats({
        total: Number(s?.total_users ?? xp.length),
        active: Number(s?.active_7d ?? 0),
        totalXp,
        ranksCount: dist.length,
      });
      setRankDist(dist);
      setTopUsers(xp.slice(0, 5));
    } catch (e: any) {
      toast.error("Erro ao carregar visão geral");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const metrics = [
    { label: "Total de Usuários", value: stats.total, icon: Users, color: "hsl(200 90% 60%)" },
    { label: "Ativos (7 dias)", value: stats.active, icon: Sparkles, color: "hsl(139 80% 50%)" },
    { label: "Ranks Distribuídos", value: stats.ranksCount, icon: Award, color: "hsl(45 95% 58%)" },
    { label: "XP Total", value: stats.totalXp.toLocaleString("pt-BR"), icon: Trophy, color: "hsl(280 80% 60%)" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(m => (
          <div key={m.label} className="relative overflow-hidden rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="absolute inset-y-0 left-0 w-1" style={{ background: m.color }} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{m.value}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
              <span>atualizado agora</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card/60 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Distribuição de Ranks</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={rankDist} margin={{ top: 10, right: 10, left: 0, bottom: 56 }}>
                  <XAxis
                    dataKey="rank"
                    interval={0}
                    height={50}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const src = rankImg(payload.value);
                      return (
                        <g transform={`translate(${x - 14}, ${y + 4})`}>
                          <image href={src} width={28} height={28} />
                        </g>
                      );
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RTooltip
                    cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                    contentStyle={{
                      background: "#14141c",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    itemStyle={{ color: "hsl(var(--muted-foreground))" }}
                    formatter={(value: any) => [value, "Usuários"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {rankDist.map((d, i) => <Cell key={i} fill={RANK_TIER_COLOR[d.rank] ?? "hsl(var(--primary))"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400" />Top 5 XP</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">#{i + 1}</div>
                <img src={rankImg(u.current_rank)} alt={u.current_rank} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.display_name || "Trader"}</p>
                  <p className="text-xs text-muted-foreground">{u.current_rank}</p>
                </div>
                <p className="text-sm font-extrabold text-primary">{u.total_xp.toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ================== TAB 2: COURSES ================== */
const emptyCourse: Partial<CourseRow> = {
  title: "", description: "", panda_video_id: "", thumbnail_url: "",
  module: "Geral", ordem: 0, published: false,
};

const CoursesTab = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CourseRow>>(emptyCourse);
  const [saving, setSaving] = useState(false);

  const [planDialogCourse, setPlanDialogCourse] = useState<CourseRow | null>(null);
  const [allPlans, setAllPlans] = useState<{ id: string; slug: string; nome: string }[]>([]);
  const [coursePlans, setCoursePlans] = useState<string[]>([]);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [savingPlans, setSavingPlans] = useState(false);

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("id, slug, nome").eq("ativo", true);
    setAllPlans(data ?? []);
  };

  const openPlanDialog = async (course: CourseRow) => {
    setPlanDialogCourse(course);
    const { data } = await supabase
      .from("course_plan_access")
      .select("plan_id")
      .eq("course_id", course.id);
    setCoursePlans((data ?? []).map(r => r.plan_id));
    setPlanDialogOpen(true);
  };

  const savePlans = async () => {
    if (!planDialogCourse) return;
    setSavingPlans(true);
    await supabase.from("course_plan_access").delete().eq("course_id", planDialogCourse.id);
    if (coursePlans.length > 0) {
      await supabase.from("course_plan_access").insert(
        coursePlans.map(pid => ({ course_id: planDialogCourse.id, plan_id: pid }))
      );
    }
    setSavingPlans(false);
    setPlanDialogOpen(false);
    toast.success("Planos atualizados");
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar aulas");
      setCourses((data as CourseRow[]) ?? []);
    } catch {
      toast.error("Erro ao carregar aulas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); fetchPlans(); }, []);

  const openNew = () => { setEditing(emptyCourse); setOpen(true); };
  const openEdit = (c: CourseRow) => { setEditing(c); setOpen(true); };

  const handleSave = async () => {
    if (!editing.title || !editing.panda_video_id) {
      toast.error("Título e ID do PandaVideo são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      title: editing.title,
      description: editing.description ?? null,
      panda_video_id: editing.panda_video_id,
      thumbnail_url: editing.thumbnail_url || null,
      module: editing.module || "Geral",
      ordem: editing.ordem ?? 0,
      published: editing.published ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? "Aula atualizada" : "Aula criada");
    setOpen(false);
    fetchCourses();
  };

  const togglePublished = async (c: CourseRow) => {
    const { error } = await supabase.from("courses").update({ published: !c.published }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(!c.published ? "Aula publicada" : "Aula despublicada");
    fetchCourses();
  };

  const handleDelete = async (c: CourseRow) => {
    if (!confirm(`Excluir "${c.title}"?`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Aula excluída");
    fetchCourses();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{courses.length} aula{courses.length !== 1 ? "s" : ""} cadastrada{courses.length !== 1 ? "s" : ""}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />Adicionar Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing.id ? "Editar aula" : "Nova aula"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={editing.title ?? ""} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>ID do PandaVideo *</Label>
                <Input value={editing.panda_video_id ?? ""} onChange={e => setEditing({ ...editing, panda_video_id: e.target.value })} placeholder="abc123def456" />
              </div>
              <div className="space-y-1.5">
                <Label>URL da thumbnail</Label>
                <Input value={editing.thumbnail_url ?? ""} onChange={e => setEditing({ ...editing, thumbnail_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Módulo</Label>
                  <Input value={editing.module ?? ""} onChange={e => setEditing({ ...editing, module: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ordem</Label>
                  <Input type="number" value={editing.ordem ?? 0} onChange={e => setEditing({ ...editing, ordem: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                <Label htmlFor="pub-switch" className="cursor-pointer">Publicado</Label>
                <Switch id="pub-switch" checked={editing.published ?? false} onCheckedChange={v => setEditing({ ...editing, published: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : courses.length === 0 ? (
        <Card className="border-border/50 bg-card/40">
          <CardContent className="p-10 text-center text-muted-foreground">
            Nenhuma aula cadastrada ainda. Clique em "Adicionar Aula" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(c => (
            <Card key={c.id} className="overflow-hidden border-border/50 bg-card/60 transition-shadow hover:shadow-[0_0_24px_-8px_hsl(var(--primary)/0.4)]">
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-background">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><BookOpen className="h-10 w-10 text-primary/40" /></div>
                )}
              </div>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 text-sm font-bold">{c.title}</h3>
                  <Badge variant="outline" className={c.published ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border bg-muted/50 text-muted-foreground"}>
                    {c.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Módulo: <span className="text-foreground">{c.module}</span> · Ordem: {c.ordem}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="flex-1 gap-1"><Pencil className="h-3 w-3" />Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => openPlanDialog(c)} className="gap-1"><KeyRound className="h-3.5 w-3.5" />Planos</Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublished(c)} title={c.published ? "Despublicar" : "Publicar"}>
                    {c.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(c)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Planos com acesso</DialogTitle>
            <p className="text-sm text-muted-foreground">Aula: {planDialogCourse?.title}</p>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {allPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                <span className="text-sm font-medium capitalize">{plan.nome}</span>
                <Switch
                  checked={coursePlans.includes(plan.id)}
                  onCheckedChange={(checked) => {
                    setCoursePlans(prev =>
                      checked ? [...prev, plan.id] : prev.filter(id => id !== plan.id)
                    );
                  }}
                />
              </div>
            ))}
            {allPlans.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano cadastrado.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={savePlans} disabled={savingPlans}>
              {savingPlans ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ================== TAB 3: USERS ================== */
const UsersTab = () => {
  const [users, setUsers] = useState<AuthUserRow[]>([]);
  const [xpMap, setXpMap] = useState<Record<string, XPRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AuthUserRow | null>(null);
  const [tx, setTx] = useState<{ amount: number; source: string; description: string | null; created_at: string }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [authRes, xpRes] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.from("user_xp")
          .select("user_id, total_xp, current_rank, streak_days, display_name, last_login_date")
          .order("total_xp", { ascending: false }),
      ]);
      setUsers((authRes.data as AuthUserRow[]) ?? []);
      const map: Record<string, XPRow> = {};
      ((xpRes.data as XPRow[]) ?? []).forEach(x => { map[x.user_id] = x; });
      setXpMap(map);
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => {
      const xp = xpMap[u.user_id];
      return u.email.toLowerCase().includes(q) || (xp?.display_name ?? "").toLowerCase().includes(q);
    });
  }, [users, search, xpMap]);

  const openDetail = async (u: AuthUserRow) => {
    setDetail(u);
    const { data } = await supabase.from("xp_transactions")
      .select("amount, source, description, created_at")
      .eq("user_id", u.user_id)
      .order("created_at", { ascending: false })
      .limit(50);
    setTx(data ?? []);
  };

  const handleClear = async (u: AuthUserRow) => {
    const xp = xpMap[u.user_id];
    if (!confirm(`Remover dados de XP de "${xp?.display_name || u.email || u.user_id}"?`)) return;
    const { error } = await supabase.from("user_xp").update({ total_xp: 0, current_rank: "Prata I", streak_days: 0 }).eq("user_id", u.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados resetados");
    fetchAll();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-border/50 bg-card/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trader</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead>Último login</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => {
                    const xp = xpMap[u.user_id];
                    const rank = xp?.current_rank ?? "Prata I";
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="font-medium">{xp?.display_name || u.email?.split("@")[0] || "Trader"}</div>
                          <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img src={rankImg(rank)} alt="" className="h-6 w-6" />
                            <Badge variant="outline" style={{ borderColor: `${RANK_TIER_COLOR[rank] ?? "hsl(var(--border))"}60`, color: RANK_TIER_COLOR[rank] }}>
                              {rank}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">{(xp?.total_xp ?? 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-center">{xp?.streak_days ?? 0}d</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDateTime(u.last_sign_in_at ?? null)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openDetail(u)}>Detalhes</Button>
                            <Button size="sm" variant="outline" onClick={() => handleClear(u)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <img src={rankImg(xpMap[detail.user_id]?.current_rank ?? "Prata I")} alt="" className="h-10 w-10" />
                  <div>
                    <div>{xpMap[detail.user_id]?.display_name || detail.email?.split("@")[0] || "Trader"}</div>
                    <div className="text-xs font-normal text-muted-foreground">{detail.email}</div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">XP</div>
                  <div className="text-lg font-extrabold text-primary">{(xpMap[detail.user_id]?.total_xp ?? 0).toLocaleString("pt-BR")}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">Streak</div>
                  <div className="text-lg font-extrabold">{xpMap[detail.user_id]?.streak_days ?? 0}d</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">Rank</div>
                  <div className="text-sm font-bold">{xpMap[detail.user_id]?.current_rank ?? "Prata I"}</div>
                </div>
              </div>
              <h4 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Últimas transações de XP</h4>
              <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
                {tx.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sem transações registradas.</p>
                ) : tx.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/40 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{t.source}</div>
                      <div className="truncate text-muted-foreground">{t.description ?? "—"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-destructive"}`}>{t.amount >= 0 ? "+" : ""}{t.amount}</div>
                      <div className="text-[10px] text-muted-foreground">{fmtDate(t.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

/* ================== TAB 4: ACCESS ================== */
const AccessTab = () => {
  const [authUsers, setAuthUsers] = useState<AuthUserRow[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, AccessRow>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ user_id: string; plan: string; access_expires_at: string; notes: string }>({
    user_id: "", plan: "pro", access_expires_at: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [authRes, accessRes] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.from("user_access").select("*"),
      ]);
      setAuthUsers((authRes.data as AuthUserRow[]) ?? []);
      const map: Record<string, AccessRow> = {};
      ((accessRes.data as AccessRow[]) ?? []).forEach(a => { map[a.user_id] = a; });
      setAccessMap(map);
    } catch {
      toast.error("Erro ao carregar dados de acesso");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return authUsers;
    const q = search.toLowerCase();
    return authUsers.filter(u => u.email.toLowerCase().includes(q));
  }, [authUsers, search]);

  const handleSave = async () => {
    if (!form.user_id) { toast.error("Selecione um usuário"); return; }
    setSaving(true);
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    const me = adminSession?.user;
    const payload = {
      user_id: form.user_id,
      plan: form.plan,
      access_expires_at: form.access_expires_at ? new Date(form.access_expires_at).toISOString() : null,
      notes: form.notes || null,
      granted_by: me?.id ?? null,
    };
    const { error } = await supabase.from("user_access").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Acesso concedido");
    setOpen(false);
    setForm({ user_id: "", plan: "pro", access_expires_at: "", notes: "" });
    fetchAll();
  };

  const isExpired = (a?: AccessRow) => a?.access_expires_at && new Date(a.access_expires_at) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" />Conceder Acesso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Conceder/atualizar acesso</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Usuário</Label>
                <Select value={form.user_id} onValueChange={v => setForm({ ...form, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                  <SelectContent>
                    {authUsers.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Validade (deixe em branco = sem expiração)</Label>
                <Input type="date" value={form.access_expires_at} onChange={e => setForm({ ...form, access_expires_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => {
                    const a = accessMap[u.user_id];
                    const plan = a?.plan ?? "free";
                    const style = PLAN_STYLES[plan] ?? PLAN_STYLES.free;
                    const expired = isExpired(a);
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell><Badge variant="outline" className={style.cls}>{style.label}</Badge></TableCell>
                        <TableCell className="text-xs"><div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-muted-foreground" />{a?.access_expires_at ? fmtDate(a.access_expires_at) : "Sem expiração"}</div></TableCell>
                        <TableCell>
                          {!a ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : expired ? (
                            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">Expirado</Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300">Ativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">{a?.notes || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ================== TAB 5: REPORTS & CRM ================== */
type CRMRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_xp: number;
  current_rank: string;
  streak_days: number;
  plan: string;
  access_expires_at: string | null;
  casatrade_user_id: string | null;
  // PB (postback)
  total_deposited: number;
  deposit_count: number | null;
  ftd_date: string | null;
  ftd_amount: number | null;
  current_balance: number;
  // WS (websocket — casatrade_balance_history)
  ws_total_deposited: number | null;
  ws_deposit_count: number | null;
  ws_ftd_date: string | null;
  ws_ftd_amount: number | null;
  aulas_assistidas: number;
  whatsapp: string | null;
  genero: string | null;
  birth_date: string | null;
};

type ColKey =
  | 'usuario' | 'plano' | 'rank' | 'dep_pb' | 'dep_ws'
  | 'saldo' | 'var_pb' | 'var_ws' | 'ftd_pb' | 'ftd_ws'
  | 'n_dep_pb' | 'n_dep_ws' | 'aulas' | 'ultimo_login'
  | 'xp' | 'streak' | 'whatsapp';

const ALL_COLS: { key: ColKey; label: string; def: boolean }[] = [
  { key: 'usuario',      label: 'Usuário',          def: true  },
  { key: 'plano',        label: 'Plano',            def: true  },
  { key: 'rank',         label: 'Rank',             def: true  },
  { key: 'dep_pb',       label: 'Total Dep. (PB)',  def: true  },
  { key: 'dep_ws',       label: 'Total Dep. (WS)',  def: true  },
  { key: 'saldo',        label: 'Saldo Atual',      def: true  },
  { key: 'var_pb',       label: 'Variação (PB)',    def: true  },
  { key: 'var_ws',       label: 'Variação (WS)',    def: false },
  { key: 'ftd_pb',       label: 'FTD (PB)',         def: true  },
  { key: 'ftd_ws',       label: 'FTD (WS)',         def: false },
  { key: 'n_dep_pb',     label: 'Depósitos (PB)',   def: false },
  { key: 'n_dep_ws',     label: 'Depósitos (WS)',   def: false },
  { key: 'aulas',        label: 'Aulas',            def: true  },
  { key: 'ultimo_login', label: 'Último Login',     def: true  },
  { key: 'xp',           label: 'XP',               def: false },
  { key: 'streak',       label: 'Streak',           def: false },
  { key: 'whatsapp',     label: 'WhatsApp',         def: false },
];

const COLS_KEY = 'virtuspro_crm_cols_v1';
const loadVisibleCols = (): Record<ColKey, boolean> => {
  try {
    const raw = localStorage.getItem(COLS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return Object.fromEntries(ALL_COLS.map(c => [c.key, c.def])) as Record<ColKey, boolean>;
};

type SortKey = ColKey | null;
type SortDir = 'asc' | 'desc';
type DepFilter = 'all' | 'ftd' | 'never' | 'above' | 'ftd_inactive' | 'inactive';

const calcIdade = (birth?: string | null): number | "" => {
  if (!birth) return "";
  const b = new Date(birth);
  if (isNaN(b.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};

const exportCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((v) => {
          if (v === null || v === undefined) return "";
          const s = String(v);
          return s.includes(",") || s.includes("\n") || s.includes('"')
            ? '"' + s.replace(/"/g, '""') + '"'
            : s;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const daysBetween = (iso: string | null) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const fmtVariacao = (n: number) => (n >= 0 ? "+" : "-") + fmtBRL(Math.abs(n)).replace("R$", "R$ ").trim();

// Parse CSV text (handles quoted fields, commas, quotes inside)
const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ",") { out.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    return obj;
  });
};

const CRMTab = () => {
  const [rows, setRows] = useState<CRMRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [depFilter, setDepFilter] = useState<DepFilter>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [thresholdAmt, setThresholdAmt] = useState("0");
  const [thresholdDays, setThresholdDays] = useState("30");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Column visibility
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>(loadVisibleCols);
  const [colsOpen, setColsOpen] = useState(false);

  // Import CSV
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);

  // Email (stub)
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Access management
  const [notesMap, setNotesMap] = useState<Record<string, string | null>>({});
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState<{ user_id: string; plan: string; access_expires_at: string; notes: string }>({
    user_id: "", plan: "pro", access_expires_at: "", notes: "",
  });
  const [grantSaving, setGrantSaving] = useState(false);

  // User detail sheet
  const [detailRow, setDetailRow] = useState<CRMRow | null>(null);
  const [detailTx, setDetailTx] = useState<{ amount: number; source: string; description: string | null; created_at: string }[]>([]);

  // WhatsApp
  const [waExportOpen, setWaExportOpen] = useState(false);
  const [waComposeOpen, setWaComposeOpen] = useState(false);
  const [waMsg, setWaMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase.rpc("admin_crm_report" as never);
      if (error) { setLoadError(error.message); toast.error("Erro: " + error.message); return; }
      setRows((data as CRMRow[]) || []);
    } catch (e: any) {
      setLoadError(e?.message ?? "Erro");
      toast.error("Erro ao carregar relatório");
    } finally { setLoading(false); }
  };

  const loadNotes = async () => {
    const { data } = await supabase.from("user_access").select("user_id, notes");
    const map: Record<string, string | null> = {};
    ((data ?? []) as { user_id: string; notes: string | null }[]).forEach(a => { map[a.user_id] = a.notes; });
    setNotesMap(map);
  };

  useEffect(() => { load(); loadNotes(); }, []);

  const persistCols = (next: Record<ColKey, boolean>) => {
    setVisibleCols(next);
    try { localStorage.setItem(COLS_KEY, JSON.stringify(next)); } catch {}
  };

  const handleSort = (key: ColKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortValue = (r: CRMRow, key: SortKey): number | string => {
    switch (key) {
      case 'usuario':      return (r.display_name ?? r.email).toLowerCase();
      case 'plano':        return r.plan;
      case 'rank':         return RANK_ORDER.indexOf(r.current_rank);
      case 'dep_pb':       return Number(r.total_deposited);
      case 'dep_ws':       return Number(r.ws_total_deposited ?? 0);
      case 'saldo':        return Number(r.current_balance);
      case 'var_pb':       return Number(r.current_balance) - Number(r.total_deposited);
      case 'var_ws':       return Number(r.current_balance) - Number(r.ws_total_deposited ?? 0);
      case 'ftd_pb':       return r.ftd_date ?? "";
      case 'ftd_ws':       return r.ws_ftd_date ?? "";
      case 'n_dep_pb':     return Number(r.deposit_count ?? 0);
      case 'n_dep_ws':     return Number(r.ws_deposit_count ?? 0);
      case 'aulas':        return r.aulas_assistidas;
      case 'ultimo_login': return r.last_sign_in_at ?? "";
      case 'xp':           return r.total_xp;
      case 'streak':       return r.streak_days;
      case 'whatsapp':     return r.whatsapp ?? "";
      default:             return 0;
    }
  };

  const filtered = useMemo(() => {
    const amt = parseFloat(thresholdAmt) || 0;
    const days = parseInt(thresholdDays) || 30;
    let result = rows.filter((r) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!(r.display_name ?? "").toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      }
      if (depFilter === "ftd"         && !r.ftd_date) return false;
      if (depFilter === "never"       && Number(r.total_deposited) > 0) return false;
      if (depFilter === "above"       && Number(r.total_deposited) <= amt) return false;
      if (depFilter === "ftd_inactive") {
        if (!r.ftd_date) return false;
        const d = daysBetween(r.last_sign_in_at);
        if (d === null || d < days) return false;
      }
      if (depFilter === "inactive") {
        const d = daysBetween(r.last_sign_in_at);
        if (d === null || d < days) return false;
      }
      if (planFilter !== "all" && r.plan !== planFilter) return false;
      if (rankFilter !== "all" && r.current_rank !== rankFilter) return false;
      return true;
    });
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, search, depFilter, planFilter, rankFilter, thresholdAmt, thresholdDays, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [depFilter, planFilter, rankFilter, search]);

  const allFilteredIds = useMemo(() => filtered.map(r => r.user_id), [filtered]);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected = allFilteredIds.some(id => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); allFilteredIds.forEach(id => n.delete(id)); return n; });
    else setSelected(prev => new Set([...prev, ...allFilteredIds]));
  };
  const toggleOne = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectedRows = useMemo(() => rows.filter(r => selected.has(r.user_id)), [rows, selected]);

  const handleExport = () => {
    const source = selectedRows.length > 0 ? selectedRows : filtered;
    if (!source.length) { toast.error("Nada para exportar"); return; }
    const out = source.map((r) => ({
      nome: r.display_name ?? "",
      email: r.email,
      whatsapp: r.whatsapp ?? "",
      genero: r.genero ?? "",
      idade: calcIdade(r.birth_date),
      casatrade_user_id: r.casatrade_user_id ?? "",
      total_dep_pb: Number(r.total_deposited).toFixed(2),
      total_dep_ws: r.ws_total_deposited != null ? Number(r.ws_total_deposited).toFixed(2) : "",
      depositos_pb: r.deposit_count ?? "",
      depositos_ws: r.ws_deposit_count ?? "",
      saldo_atual: Number(r.current_balance).toFixed(2),
      variacao_pb: fmtVariacao(Number(r.current_balance) - Number(r.total_deposited)),
      variacao_ws: r.ws_total_deposited != null ? fmtVariacao(Number(r.current_balance) - Number(r.ws_total_deposited)) : "",
      ftd_pb_data: r.ftd_date ? new Date(r.ftd_date).toLocaleDateString("pt-BR") : "",
      ftd_pb_valor: r.ftd_amount != null ? Number(r.ftd_amount).toFixed(2) : "",
      ftd_ws_data: r.ws_ftd_date ? new Date(r.ws_ftd_date).toLocaleDateString("pt-BR") : "",
      ftd_ws_valor: r.ws_ftd_amount != null ? Number(r.ws_ftd_amount).toFixed(2) : "",
      rank: r.current_rank,
      xp: r.total_xp,
      streak_dias: r.streak_days,
      plano: r.plan,
      acesso_expira: r.access_expires_at ? new Date(r.access_expires_at).toLocaleDateString("pt-BR") : "",
      ultimo_login: r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleString("pt-BR") : "",
      dias_sem_login: daysBetween(r.last_sign_in_at) ?? "",
      aulas_assistidas: r.aulas_assistidas,
      criado_em: new Date(r.created_at).toLocaleDateString("pt-BR"),
    }));
    exportCSV(out, "iavingativa-crm-" + new Date().toISOString().split("T")[0] + ".csv");
    toast.success(`${out.length} linhas exportadas`);
  };

  const applyWaTemplate = (msg: string, r: CRMRow) =>
    msg
      .replace(/\{nome\}/g, r.display_name ?? r.email.split("@")[0])
      .replace(/\{email\}/g, r.email)
      .replace(/\{total_depositado\}/g, fmtBRL(Number(r.total_deposited)))
      .replace(/\{saldo\}/g, fmtBRL(Number(r.current_balance)))
      .replace(/\{plano\}/g, r.plan);

  const handleWaExport = () => {
    const source = selectedRows.length > 0 ? selectedRows : filtered;
    const withWa = source.filter(r => r.whatsapp);
    if (!withWa.length) { toast.error("Nenhum usuário com WhatsApp cadastrado"); return; }
    exportCSV(withWa.map(r => ({
      nome: r.display_name ?? r.email.split("@")[0],
      whatsapp: r.whatsapp ?? "",
      email: r.email,
      link_wa: `https://wa.me/${(r.whatsapp ?? "").replace(/\D/g, "")}`,
    })), "whatsapp-list-" + new Date().toISOString().split("T")[0] + ".csv");
    toast.success(`${withWa.length} contatos exportados`);
    setWaExportOpen(false);
  };

  const handleWaCopyLinks = () => {
    const source = selectedRows.length > 0 ? selectedRows : filtered;
    const withWa = source.filter(r => r.whatsapp);
    if (!withWa.length) { toast.error("Nenhum usuário com WhatsApp"); return; }
    const links = withWa.map(r => {
      const num = (r.whatsapp ?? "").replace(/\D/g, "");
      return `https://wa.me/${num}?text=${encodeURIComponent(applyWaTemplate(waMsg, r))}`;
    }).join("\n");
    navigator.clipboard.writeText(links);
    toast.success(`${withWa.length} links copiados para a área de transferência`);
  };

  const handleParsePreview = () => {
    try {
      const parsed = parseCSV(csvText);
      if (!parsed.length) { toast.error("Nenhuma linha encontrada"); return; }
      const missing = ["email"].filter(r => !(r in parsed[0]));
      if (missing.length) { toast.error("Colunas faltando: " + missing.join(", ")); return; }
      const valid = parsed.filter(r => r.email?.trim());
      const skipped = parsed.length - valid.length;
      if (!valid.length) { toast.error("Nenhuma linha com email válido"); return; }
      if (skipped > 0) toast.warning(`${skipped} linha(s) sem email ignoradas`);
      setPreviewRows(valid);
    } catch { toast.error("CSV inválido"); }
  };

  const handleImport = async () => {
    if (!previewRows.length) return;
    setImporting(true);
    const payload = previewRows.map(r => ({
      email: r.email,
      casatrade_user_id: r.casatrade_user_id || "",
      total_deposited: r.total_deposited || "0",
      current_balance: r.current_balance || "0",
      ftd_date: r.ftd_date || "",
    }));
    const { data, error } = await supabase.rpc("admin_upsert_casatrade" as never, { rows: payload } as never);
    setImporting(false);
    if (error) { toast.error("Falha: " + error.message); return; }
    toast.success(`${data ?? payload.length} linhas importadas`);
    setImportOpen(false); setCsvText(""); setPreviewRows([]); load();
  };

  const handleGrantAccess = async () => {
    if (!grantForm.user_id) { toast.error("Selecione um usuário"); return; }
    setGrantSaving(true);
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    const me = adminSession?.user;
    const payload = {
      user_id: grantForm.user_id,
      plan: grantForm.plan,
      access_expires_at: grantForm.access_expires_at ? new Date(grantForm.access_expires_at).toISOString() : null,
      notes: grantForm.notes || null,
      granted_by: me?.id ?? null,
    };
    const { error } = await supabase.from("user_access").upsert(payload, { onConflict: "user_id" });
    setGrantSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Acesso concedido");
    setGrantOpen(false);
    setGrantForm({ user_id: "", plan: "pro", access_expires_at: "", notes: "" });
    load(); loadNotes();
  };

  const openDetail = async (r: CRMRow) => {
    setDetailRow(r);
    const { data } = await supabase.from("xp_transactions")
      .select("amount, source, description, created_at")
      .eq("user_id", r.user_id)
      .order("created_at", { ascending: false })
      .limit(50);
    setDetailTx(data ?? []);
  };

  const isExpiredAccess = (r: CRMRow) =>
    !!(r.access_expires_at && new Date(r.access_expires_at) < new Date());

  const SortIcon = ({ col }: { col: ColKey }) =>
    sortKey !== col
      ? <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-30" />
      : sortDir === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
        : <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />;

  const TH = ({ col, label, align = "" }: { col: ColKey; label: string; align?: string }) => (
    <TableHead className={`cursor-pointer select-none whitespace-nowrap ${align}`} onClick={() => handleSort(col)}>
      {label}<SortIcon col={col} />
    </TableHead>
  );

  const VarCell = ({ balance, deposited }: { balance: number | null; deposited: number | null }) => {
    if (deposited === null || deposited === 0 || balance === null) return <span className="text-muted-foreground">—</span>;
    const v = balance - deposited;
    return (
      <span className={`inline-flex items-center gap-1 tabular-nums ${v >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
        {v >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {fmtVariacao(v)}
      </span>
    );
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (loadError) return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Falha ao carregar: {loadError}</p>
      <Button variant="outline" onClick={load}>Tentar novamente</Button>
    </div>
  );

  const waCount = (selectedRows.length > 0 ? selectedRows : filtered).filter(r => r.whatsapp).length;
  const needsAmt  = depFilter === "above";
  const needsDays = depFilter === "ftd_inactive" || depFilter === "inactive";

  return (
    <div className="space-y-4">
      {/* ── Action bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Relatórios & CRM</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {rows.length} usuários
            {selected.size > 0 && <span className="ml-2 text-primary">· {selected.size} selecionados</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Import CSV — disabled */}
          <Button variant="outline" disabled className="gap-2 cursor-not-allowed opacity-50" title="Disponível em breve">
            <Upload className="h-4 w-4" /> Importar CSV do Painel do Afiliado
          </Button>

          {/* Export CSV */}
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            {selectedRows.length > 0 ? `Exportar (${selectedRows.length})` : "Exportar CSV"}
          </Button>

          {/* WhatsApp Export */}
          <Dialog open={waExportOpen} onOpenChange={setWaExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Phone className="h-4 w-4" /> Exportar lista WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Exportar lista WhatsApp</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">
                Exporta CSV com nome, número e link wa.me de{" "}
                <strong className="text-foreground">{waCount}</strong>{" "}
                usuário{waCount !== 1 ? "s" : ""} com WhatsApp cadastrado
                {selectedRows.length > 0 ? " (selecionados)" : " (filtro atual)"}.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWaExportOpen(false)}>Cancelar</Button>
                <Button onClick={handleWaExport} className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* WhatsApp Compose */}
          <Dialog open={waComposeOpen} onOpenChange={setWaComposeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" /> Compor mensagem WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Compor mensagem WhatsApp</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Variáveis:{" "}
                  {["{nome}", "{email}", "{total_depositado}", "{saldo}", "{plano}"].map(v => (
                    <code key={v} className="mx-0.5 rounded bg-muted px-1">{v}</code>
                  ))}
                </p>
                <Textarea
                  placeholder="Olá {nome}, temos uma oferta especial para você..."
                  value={waMsg}
                  onChange={e => setWaMsg(e.target.value)}
                  className="min-h-[120px] text-sm"
                />
                {waMsg && rows.length > 0 && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview (1º usuário)</p>
                    <p className="whitespace-pre-wrap">{applyWaTemplate(waMsg, rows[0])}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Gera links <code className="rounded bg-muted px-1">wa.me</code> individuais para cada contato com WhatsApp. Use em extensões de disparo ou acesse manualmente.
                </p>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setWaComposeOpen(false)}>Fechar</Button>
                <Button onClick={handleWaCopyLinks} disabled={!waMsg.trim()} className="gap-2">
                  <MessageCircle className="h-4 w-4" /> Copiar links wa.me ({waCount})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Email (stub) */}
          <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                {selectedRows.length > 0 ? `Enviar e-mail (${selectedRows.length})` : "Enviar e-mail"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Enviar e-mail para selecionados</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  Envio de e-mail será configurado em breve. Por enquanto, exporte o CSV e use sua ferramenta de e-mail marketing.
                </div>
                <div className="space-y-1.5">
                  <Label>Assunto</Label>
                  <Input placeholder="Assunto do e-mail..." value={emailSubject} onChange={e => setEmailSubject(e.target.value)} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Mensagem</Label>
                  <Textarea placeholder="Corpo do e-mail..." value={emailBody} onChange={e => setEmailBody(e.target.value)} className="min-h-[120px]" disabled />
                </div>
                <p className="text-xs text-muted-foreground">
                  Destinatários: <strong>{selectedRows.length > 0 ? selectedRows.length : filtered.length}</strong> usuários
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailOpen(false)}>Fechar</Button>
                <Button disabled className="gap-2 cursor-not-allowed opacity-50">
                  <Mail className="h-4 w-4" /> Enviar (em breve)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={() => { load(); loadNotes(); }} title="Recarregar"><RefreshCw className="h-4 w-4" /></Button>

          {/* Conceder Acesso */}
          <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Conceder Acesso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Conceder / atualizar acesso</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Usuário</Label>
                  <Select value={grantForm.user_id} onValueChange={v => setGrantForm({ ...grantForm, user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {rows.map(r => (
                        <SelectItem key={r.user_id} value={r.user_id}>
                          {r.display_name ? `${r.display_name} (${r.email})` : r.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Plano</Label>
                  <Select value={grantForm.plan} onValueChange={v => setGrantForm({ ...grantForm, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="elite">Elite</SelectItem>
                      <SelectItem value="vitalicio">Vitalício</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Validade (deixe em branco = sem expiração)</Label>
                  <Input type="date" value={grantForm.access_expires_at} onChange={e => setGrantForm({ ...grantForm, access_expires_at: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Textarea value={grantForm.notes} onChange={e => setGrantForm({ ...grantForm, notes: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGrantOpen(false)}>Cancelar</Button>
                <Button onClick={handleGrantAccess} disabled={grantSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {grantSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Filters ── */}
      <Card className="border-border/50 bg-[#14141c]">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <Select value={depFilter} onValueChange={v => setDepFilter(v as DepFilter)}>
            <SelectTrigger className="w-[230px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ftd">FTD realizado</SelectItem>
              <SelectItem value="never">Nunca depositou</SelectItem>
              <SelectItem value="above">Depositou acima de R$...</SelectItem>
              <SelectItem value="ftd_inactive">FTD mas inativo há +X dias</SelectItem>
              <SelectItem value="inactive">Sem login há +X dias</SelectItem>
            </SelectContent>
          </Select>

          {needsAmt && (
            <Input type="number" min="0" placeholder="Valor R$" value={thresholdAmt}
              onChange={e => setThresholdAmt(e.target.value)} className="w-28" />
          )}
          {needsDays && (
            <Input type="number" min="1" placeholder="Dias" value={thresholdDays}
              onChange={e => setThresholdDays(e.target.value)} className="w-24" />
          )}

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
              <SelectItem value="vitalicio">Vitalício</SelectItem>
            </SelectContent>
          </Select>

          <Select value={rankFilter} onValueChange={setRankFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Rank" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Todos os ranks</SelectItem>
              {RANK_ORDER.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Dialog open={colsOpen} onOpenChange={setColsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <SlidersHorizontal className="h-4 w-4" /> Colunas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogHeader><DialogTitle>Colunas visíveis</DialogTitle></DialogHeader>
              <div className="max-h-[60vh] space-y-1 overflow-y-auto">
                {ALL_COLS.map(col => (
                  <label key={col.key} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
                    <input type="checkbox" checked={!!visibleCols[col.key]}
                      onChange={e => persistCols({ ...visibleCols, [col.key]: e.target.checked })}
                      className="accent-primary" />
                    <span className="text-sm">{col.label}</span>
                  </label>
                ))}
              </div>
              <DialogFooter>
                <Button variant="ghost" size="sm"
                  onClick={() => persistCols(Object.fromEntries(ALL_COLS.map(c => [c.key, c.def])) as Record<ColKey, boolean>)}>
                  Restaurar padrão
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="border-border/50 bg-[#14141c]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll} className="accent-primary cursor-pointer" />
                  </TableHead>
                  {visibleCols.usuario      && <TH col="usuario"      label="Usuário" />}
                  {visibleCols.plano        && <TH col="plano"        label="Plano" />}
                  {visibleCols.rank         && <TH col="rank"         label="Rank" />}
                  {visibleCols.dep_pb       && <TH col="dep_pb"       label="Total Dep. (PB)" align="text-right" />}
                  {visibleCols.dep_ws       && <TH col="dep_ws"       label="Total Dep. (WS)" align="text-right" />}
                  {visibleCols.saldo        && <TH col="saldo"        label="Saldo Atual"      align="text-right" />}
                  {visibleCols.var_pb       && <TH col="var_pb"       label="Variação (PB)"   align="text-right" />}
                  {visibleCols.var_ws       && <TH col="var_ws"       label="Variação (WS)"   align="text-right" />}
                  {visibleCols.ftd_pb       && <TH col="ftd_pb"       label="FTD (PB)" />}
                  {visibleCols.ftd_ws       && <TH col="ftd_ws"       label="FTD (WS)" />}
                  {visibleCols.n_dep_pb     && <TH col="n_dep_pb"     label="Dep. (PB)"       align="text-right" />}
                  {visibleCols.n_dep_ws     && <TH col="n_dep_ws"     label="Dep. (WS)"       align="text-right" />}
                  {visibleCols.aulas        && <TH col="aulas"        label="Aulas"            align="text-right" />}
                  {visibleCols.ultimo_login && <TH col="ultimo_login" label="Último Login" />}
                  {visibleCols.xp           && <TH col="xp"           label="XP"               align="text-right" />}
                  {visibleCols.streak       && <TH col="streak"       label="Streak"           align="text-right" />}
                  {visibleCols.whatsapp     && <TH col="whatsapp"     label="WhatsApp" />}
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={23} className="py-10 text-center text-sm text-muted-foreground">
                      <AlertCircle className="mx-auto mb-2 h-5 w-5" />
                      Nenhum registro com os filtros atuais
                    </TableCell>
                  </TableRow>
                ) : pageRows.map((r) => {
                  const planMeta = PLAN_STYLES[r.plan] ?? PLAN_STYLES.free;
                  const isSel = selected.has(r.user_id);
                  return (
                    <TableRow key={r.user_id} className={isSel ? "bg-primary/5" : ""}>
                      <TableCell>
                        <input type="checkbox" checked={isSel} onChange={() => toggleOne(r.user_id)} className="accent-primary cursor-pointer" />
                      </TableCell>

                      {visibleCols.usuario && (
                        <TableCell className="min-w-[180px]">
                          <div className="font-bold text-sm leading-tight">{r.display_name || r.email.split("@")[0]}</div>
                          <div className="font-mono text-xs text-muted-foreground">{r.email}</div>
                        </TableCell>
                      )}
                      {visibleCols.plano && (
                        <TableCell><Badge variant="outline" className={planMeta.cls}>{planMeta.label}</Badge></TableCell>
                      )}
                      {visibleCols.rank && (
                        <TableCell className="whitespace-nowrap text-xs">{r.current_rank}</TableCell>
                      )}
                      {visibleCols.dep_pb && (
                        <TableCell className="text-right tabular-nums">{fmtBRL(Number(r.total_deposited))}</TableCell>
                      )}
                      {visibleCols.dep_ws && (
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {r.ws_total_deposited != null ? fmtBRL(Number(r.ws_total_deposited)) : <span className="opacity-40">—</span>}
                        </TableCell>
                      )}
                      {visibleCols.saldo && (
                        <TableCell className="text-right tabular-nums">{fmtBRL(Number(r.current_balance))}</TableCell>
                      )}
                      {visibleCols.var_pb && (
                        <TableCell className="text-right">
                          <VarCell balance={Number(r.current_balance)} deposited={Number(r.total_deposited)} />
                        </TableCell>
                      )}
                      {visibleCols.var_ws && (
                        <TableCell className="text-right">
                          <VarCell
                            balance={r.ws_total_deposited != null ? Number(r.current_balance) : null}
                            deposited={r.ws_total_deposited != null ? Number(r.ws_total_deposited) : null}
                          />
                        </TableCell>
                      )}
                      {visibleCols.ftd_pb && (
                        <TableCell className="whitespace-nowrap">
                          {r.ftd_date ? (
                            <div>
                              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-300">
                                {fmtDate(r.ftd_date)}
                              </Badge>
                              {r.ftd_amount != null && (
                                <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">{fmtBRL(Number(r.ftd_amount))}</div>
                              )}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {visibleCols.ftd_ws && (
                        <TableCell className="whitespace-nowrap">
                          {r.ws_ftd_date ? (
                            <div>
                              <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-[10px] text-blue-300">
                                {fmtDate(r.ws_ftd_date)}
                              </Badge>
                              {r.ws_ftd_amount != null && (
                                <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">{fmtBRL(Number(r.ws_ftd_amount))}</div>
                              )}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {visibleCols.n_dep_pb && (
                        <TableCell className="text-right tabular-nums">
                          {r.deposit_count ?? <span className="opacity-40">—</span>}
                        </TableCell>
                      )}
                      {visibleCols.n_dep_ws && (
                        <TableCell className="text-right tabular-nums">
                          {r.ws_deposit_count ?? <span className="opacity-40">—</span>}
                        </TableCell>
                      )}
                      {visibleCols.aulas && (
                        <TableCell className="text-right tabular-nums">{r.aulas_assistidas}</TableCell>
                      )}
                      {visibleCols.ultimo_login && (
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(r.last_sign_in_at)}</TableCell>
                      )}
                      {visibleCols.xp && (
                        <TableCell className="text-right font-mono tabular-nums text-primary">{r.total_xp.toLocaleString("pt-BR")}</TableCell>
                      )}
                      {visibleCols.streak && (
                        <TableCell className="text-right tabular-nums">{r.streak_days}d</TableCell>
                      )}
                      {visibleCols.whatsapp && (
                        <TableCell className="text-xs text-muted-foreground">{r.whatsapp ?? "—"}</TableCell>
                      )}
                      <TableCell>
                        {r.plan === "free" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : isExpiredAccess(r) ? (
                          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-xs">Expirado</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                        {notesMap[r.user_id] || "—"}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openDetail(r)}>Detalhes</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Página {page} de {pageCount} · {filtered.length} registros</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes Sheet */}
      <Sheet open={!!detailRow} onOpenChange={v => !v && setDetailRow(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {detailRow && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <img src={rankImg(detailRow.current_rank ?? "Prata I")} alt="" className="h-10 w-10" />
                  <div>
                    <div>{detailRow.display_name || detailRow.email.split("@")[0]}</div>
                    <div className="text-xs font-normal text-muted-foreground">{detailRow.email}</div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">XP</div>
                  <div className="text-lg font-extrabold text-primary">{detailRow.total_xp.toLocaleString("pt-BR")}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">Streak</div>
                  <div className="text-lg font-extrabold">{detailRow.streak_days}d</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">Rank</div>
                  <div className="text-sm font-bold">{detailRow.current_rank}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">Plano</div>
                  <div className="text-sm font-bold">{PLAN_STYLES[detailRow.plan]?.label ?? detailRow.plan}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center">
                  <div className="text-xs uppercase text-muted-foreground">Acesso expira</div>
                  <div className="text-sm font-bold">{detailRow.access_expires_at ? fmtDate(detailRow.access_expires_at) : "—"}</div>
                </div>
              </div>
              {notesMap[detailRow.user_id] && (
                <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Obs: </span>{notesMap[detailRow.user_id]}
                </div>
              )}
              <h4 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Últimas transações de XP</h4>
              <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 420px)" }}>
                {detailTx.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sem transações registradas.</p>
                ) : detailTx.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/40 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{t.source}</div>
                      <div className="truncate text-muted-foreground">{t.description ?? "—"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-destructive"}`}>{t.amount >= 0 ? "+" : ""}{t.amount}</div>
                      <div className="text-[10px] text-muted-foreground">{fmtDate(t.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

/* ================== TAB: GAMIFICAÇÃO ================== */
type GamXPRow = {
  user_id: string;
  display_name: string | null;
  current_rank: string;
  streak_days: number;
  season_xp: number;
};

type BadgeCount = { key: string; title: string; count: number; badge_group: string };

const GamificationTab = () => {
  const [loading, setLoading] = useState(true);
  const [gamStats, setGamStats] = useState({ seasonXp: 0, activeStreaks: 0, badgesEarned: 0, missionsCompleted: 0 });
  const [topStreakers, setTopStreakers] = useState<GamXPRow[]>([]);
  const [topBadges, setTopBadges] = useState<BadgeCount[]>([]);
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ user_id: "", amount: "", source: "admin_grant", description: "" });
  const [authUsers, setAuthUsers] = useState<AuthUserRow[]>([]);
  const [awarding, setAwarding] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [xpRes, achievementsRes, missionsRes, authRes] = await Promise.all([
        supabase.from("user_xp").select("user_id, display_name, current_rank, streak_days, season_xp"),
        (supabase.from as any)("user_achievements").select("achievement_key").not("earned_at", "is", null),
        (supabase.from as any)("user_missions").select("completed_at").not("completed_at", "is", null),
        supabase.rpc("admin_list_users"),
      ]);

      const xp = (xpRes.data ?? []) as GamXPRow[];
      const achievements = (achievementsRes.data ?? []) as { achievement_key: string }[];
      const missions = (missionsRes.data ?? []) as unknown[];

      const seasonXp = xp.reduce((s, r) => s + (r.season_xp ?? 0), 0);
      const activeStreaks = xp.filter(r => (r.streak_days ?? 0) > 0).length;
      setGamStats({ seasonXp, activeStreaks, badgesEarned: achievements.length, missionsCompleted: missions.length });

      setTopStreakers([...xp].sort((a, b) => (b.streak_days ?? 0) - (a.streak_days ?? 0)).slice(0, 5));

      const badgeCounts = new Map<string, BadgeCount>();
      achievements.forEach(a => {
        const prev = badgeCounts.get(a.achievement_key) ?? { key: a.achievement_key, title: a.achievement_key, count: 0, badge_group: "-" };
        badgeCounts.set(a.achievement_key, { ...prev, count: prev.count + 1 });
      });
      setTopBadges([...badgeCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8));
      setAuthUsers((authRes.data as AuthUserRow[]) ?? []);
    } catch {
      toast.error("Erro ao carregar dados de gamificação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAwardXp = async () => {
    const amount = Number(awardForm.amount);
    if (!awardForm.user_id || !amount) { toast.error("Selecione usuário e informe o valor"); return; }
    setAwarding(true);
    const { error } = await supabase.rpc("award_xp" as never, {
      p_user_id: awardForm.user_id,
      p_amount: amount,
      p_source: awardForm.source || "admin_grant",
      p_description: awardForm.description || null,
    } as never);
    setAwarding(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${amount} XP concedido com sucesso`);
    setAwardOpen(false);
    setAwardForm({ user_id: "", amount: "", source: "admin_grant", description: "" });
    fetchAll();
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const gamMetrics = [
    { label: "XP da Temporada", value: gamStats.seasonXp.toLocaleString("pt-BR"), icon: Zap, color: "hsl(50 100% 60%)" },
    { label: "Streaks Ativos", value: gamStats.activeStreaks, icon: Flame, color: "hsl(20 90% 60%)" },
    { label: "Badges Conquistados", value: gamStats.badgesEarned, icon: Gift, color: "hsl(280 80% 60%)" },
    { label: "Missões Completas", value: gamStats.missionsCompleted, icon: Star, color: "hsl(139 80% 50%)" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {gamMetrics.map(m => (
          <div key={m.label} className="relative overflow-hidden rounded-xl border border-border/40 bg-card/40 p-5">
            <div className="absolute inset-y-0 left-0 w-1" style={{ background: m.color }} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{m.value}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
              <span>temporada atual</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/60">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Flame className="h-4 w-4 text-orange-400" />Top Streakers</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topStreakers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum streak ativo.</p>
            ) : topStreakers.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/15 text-xs font-extrabold text-orange-400">#{i + 1}</div>
                <img src={rankImg(u.current_rank)} alt={u.current_rank} className="h-7 w-7" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.display_name || "Trader"}</p>
                  <p className="text-xs text-muted-foreground">{u.current_rank}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-orange-400">
                  <Flame className="h-3.5 w-3.5" />{u.streak_days}d
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-purple-400" />Badges Mais Conquistados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topBadges.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum badge registrado.</p>
            ) : topBadges.map((b, i) => (
              <div key={b.key} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15 text-xs font-extrabold text-purple-400">#{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{b.badge_group}</p>
                </div>
                <Badge variant="outline" className="shrink-0 border-purple-500/40 bg-purple-500/10 tabular-nums text-purple-300">{b.count}×</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-4 w-4 text-yellow-400" />Conceder XP Manual</CardTitle>
            <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" />Conceder XP</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Conceder XP a um usuário</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Usuário</Label>
                    <Select value={awardForm.user_id} onValueChange={v => setAwardForm({ ...awardForm, user_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {authUsers.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quantidade de XP</Label>
                    <Input type="number" min={1} value={awardForm.amount} onChange={e => setAwardForm({ ...awardForm, amount: e.target.value })} placeholder="Ex: 500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fonte</Label>
                    <Input value={awardForm.source} onChange={e => setAwardForm({ ...awardForm, source: e.target.value })} placeholder="admin_grant" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição (opcional)</Label>
                    <Textarea value={awardForm.description} onChange={e => setAwardForm({ ...awardForm, description: e.target.value })} rows={2} placeholder="Motivo da concessão..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAwardOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAwardXp} disabled={awarding} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {awarding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conceder"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Conceda XP manualmente a um usuário para eventos, promoções ou correções. O XP é registrado com a fonte informada e aparece no histórico de transações do usuário.</p>
        </CardContent>
      </Card>
    </div>
  );
};

/* ================== TAB: CAKTO ================== */
type KProductMap = {
  id: string;
  cakto_product_id: string;
  cakto_product_nome: string | null;
  tipo: string;
  ref_id: string;
  ativo: boolean;
};
type KEvent = {
  id: string;
  evento: string;
  cakto_email: string | null;
  cakto_order_id: string | null;
  status: string | null;
  erro: string | null;
  processado_em: string | null;
};
type PlanOpt = { id: string; nome: string; slug: string };
type UpsellOpt = { id: string; nome: string };

const CaktoTab = () => {
  const [maps, setMaps] = useState<KProductMap[]>([]);
  const [refNames, setRefNames] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<KEvent[]>([]);
  const [plans, setPlans] = useState<PlanOpt[]>([]);
  const [upsells, setUpsells] = useState<UpsellOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [evLoading, setEvLoading] = useState(false);
  const [evClearing, setEvClearing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<KProductMap>>({ tipo: "plan", ativo: true });
  const [saving, setSaving] = useState(false);

  // SEÇÃO C: Upsells
  type UpsellRow = {
    id: string;
    nome: string;
    descricao: string | null;
    tipo: string;
    valor: number | null;
    preco_label: string | null;
    checkout_url: string | null;
    is_recorrente: boolean | null;
    ativo: boolean | null;
  };
  const [upsellRows, setUpsellRows] = useState<UpsellRow[]>([]);
  const [upOpen, setUpOpen] = useState(false);
  const [upEditing, setUpEditing] = useState<Partial<UpsellRow>>({ tipo: "one_time", ativo: true, is_recorrente: false });
  const [upSaving, setUpSaving] = useState(false);

  const loadUpsellRows = async () => {
    const { data } = await supabase
      .from("upsells")
      .select("id, nome, descricao, tipo, valor, preco_label, checkout_url, is_recorrente, ativo")
      .order("nome");
    setUpsellRows((data ?? []) as UpsellRow[]);
  };

  const openNewUpsell = () => {
    setUpEditing({ tipo: "one_time", ativo: true, is_recorrente: false });
    setUpOpen(true);
  };

  const openEditUpsell = (u: UpsellRow) => {
    setUpEditing(u);
    setUpOpen(true);
  };

  const handleSaveUpsell = async () => {
    if (!upEditing.nome || !upEditing.tipo) {
      toast.error("Preencha nome e tipo");
      return;
    }
    setUpSaving(true);
    const payload: any = {
      nome: upEditing.nome,
      descricao: upEditing.descricao || null,
      tipo: upEditing.tipo,
      valor: upEditing.valor ?? null,
      preco_label: upEditing.preco_label || null,
      checkout_url: upEditing.checkout_url || null,
      is_recorrente: upEditing.is_recorrente ?? false,
      ativo: upEditing.ativo ?? true,
    };
    const { error } = upEditing.id
      ? await supabase.from("upsells").update(payload).eq("id", upEditing.id)
      : await supabase.from("upsells").insert(payload);
    setUpSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(upEditing.id ? "Upsell atualizado" : "Upsell criado");
    setUpOpen(false);
    loadUpsellRows();
  };

  const toggleUpsellAtivo = async (u: UpsellRow) => {
    const { error } = await supabase.from("upsells").update({ ativo: !u.ativo }).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    loadUpsellRows();
  };

  const handleDeleteUpsell = async (u: UpsellRow) => {
    if (!confirm(`Remover upsell "${u.nome}"?`)) return;
    const { error } = await supabase.from("upsells").delete().eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Upsell removido");
    loadUpsellRows();
  };

  // SEÇÃO D: Marketplace
  type MarketplaceRow = {
    id: string;
    user_id: string;
    strategy_id: string;
    nome: string;
    descricao: string | null;
    preco_sugerido: number | null;
    preview_winrate: number | null;
    preview_trades: number | null;
    status: string;
    checkout_url: string | null;
    comissao_pct: number | null;
    admin_notes: string | null;
    created_at: string;
    user_email?: string;
  };
  const [mktRows, setMktRows] = useState<MarketplaceRow[]>([]);
  const [mktFilter, setMktFilter] = useState<string>("all");
  const [mktApproveDialog, setMktApproveDialog] = useState(false);
  const [mktRejectDialog, setMktRejectDialog] = useState(false);
  const [mktSelected, setMktSelected] = useState<MarketplaceRow | null>(null);
  const [mktCheckoutUrl, setMktCheckoutUrl] = useState("");
  const [mktComissao, setMktComissao] = useState("30");
  const [mktAdminNotes, setMktAdminNotes] = useState("");
  const [mktSaving, setMktSaving] = useState(false);

  const loadMkt = async () => {
    const { data } = await (supabase as any)
      .from("marketplace_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setMktRows((data ?? []) as MarketplaceRow[]);
  };

  const openApprove = (m: MarketplaceRow) => {
    setMktSelected(m);
    setMktCheckoutUrl(m.checkout_url ?? "");
    setMktComissao(String(m.comissao_pct ?? 30));
    setMktApproveDialog(true);
  };

  const openReject = (m: MarketplaceRow) => {
    setMktSelected(m);
    setMktAdminNotes(m.admin_notes ?? "");
    setMktRejectDialog(true);
  };

  const handleApprove = async () => {
    if (!mktSelected || !mktCheckoutUrl.trim()) return;
    setMktSaving(true);
    const { error } = await (supabase as any).from("marketplace_submissions").update({
      status: "approved",
      checkout_url: mktCheckoutUrl.trim(),
      comissao_pct: parseInt(mktComissao) || 30,
      updated_at: new Date().toISOString(),
    }).eq("id", mktSelected.id);
    setMktSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Estratégia aprovada!");
    setMktApproveDialog(false); setMktCheckoutUrl(""); setMktComissao("30");
    loadMkt();
  };

  const handleReject = async () => {
    if (!mktSelected) return;
    setMktSaving(true);
    const { error } = await (supabase as any).from("marketplace_submissions").update({
      status: "rejected",
      admin_notes: mktAdminNotes.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq("id", mktSelected.id);
    setMktSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Submissão rejeitada.");
    setMktRejectDialog(false); setMktAdminNotes("");
    loadMkt();
  };


  const loadMaps = async () => {
    const [{ data: m }, { data: pl }, { data: up }] = await Promise.all([
      supabase.from("cakto_product_map").select("*").order("created_at", { ascending: false }),
      supabase.from("plans").select("id, nome, slug").order("nome"),
      supabase.from("upsells").select("id, nome").order("nome"),
    ]);
    const planList = (pl ?? []) as PlanOpt[];
    const upList = (up ?? []) as UpsellOpt[];
    setPlans(planList);
    setUpsells(upList);
    const names: Record<string, string> = {};
    planList.forEach(p => { names[p.id] = `${p.nome} (plano)`; });
    upList.forEach(u => { names[u.id] = `${u.nome} (upsell)`; });
    setRefNames(names);
    setMaps((m ?? []) as KProductMap[]);
  };

  const loadEvents = async () => {
    setEvLoading(true);
    const { data } = await supabase
      .from("cakto_events")
      .select("id, evento, cakto_email, cakto_order_id, status, erro, processado_em")
      .order("processado_em", { ascending: false })
      .limit(50);
    setEvents((data ?? []) as KEvent[]);
    setEvLoading(false);
  };

  const handleClearEvents = async () => {
    if (!confirm("Limpar todos os eventos? Esta ação não pode ser desfeita.")) return;
    setEvClearing(true);
    const { error } = await supabase.from("cakto_events").delete().gte("id", "00000000-0000-0000-0000-000000000000");
    setEvClearing(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Eventos apagados");
    loadEvents();
  };

  const fetchAll = async () => {
    setLoading(true);
    try { await Promise.all([loadMaps(), loadEvents(), loadUpsellRows(), loadMkt()]); }
    catch { toast.error("Erro ao carregar dados"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => { setEditing({ tipo: "plan", ativo: true }); setOpen(true); };

  const handleSave = async () => {
    if (!editing.cakto_product_id || !editing.tipo || !editing.ref_id) {
      toast.error("Preencha ID do produto, tipo e vínculo");
      return;
    }
    setSaving(true);
    const payload = {
      cakto_product_id: editing.cakto_product_id,
      cakto_product_nome: editing.cakto_product_nome || null,
      tipo: editing.tipo,
      ref_id: editing.ref_id,
      ativo: editing.ativo ?? true,
    };
    const { error } = await supabase.from("cakto_product_map").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mapeamento criado");
    setOpen(false);
    loadMaps();
  };

  const toggleAtivo = async (m: KProductMap) => {
    const { error } = await supabase.from("cakto_product_map").update({ ativo: !m.ativo }).eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    loadMaps();
  };

  const handleDelete = async (m: KProductMap) => {
    if (!confirm(`Remover mapeamento do produto "${m.cakto_product_nome || m.cakto_product_id}"?`)) return;
    const { error } = await supabase.from("cakto_product_map").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mapeamento removido");
    loadMaps();
  };

  const statusBadge = (s: string | null) => {
    if (s === "processed") return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40">processed</Badge>;
    if (s === "error") return <Badge className="bg-red-500/15 text-red-300 border-red-500/40">error</Badge>;
    if (s === "ignored") return <Badge className="bg-muted text-muted-foreground border-border">ignored</Badge>;
    return <Badge variant="outline">{s ?? "—"}</Badge>;
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const refOptions = editing.tipo === "upsell" ? upsells : plans;

  return (
    <div className="space-y-6">
      {/* SEÇÃO A: Mapeamento */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Produtos Cakto → Planos / Upsells</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Mapeie cada produto da Cakto ao plano ou upsell correspondente nesta plataforma.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />Novo Mapeamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Mapeamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>ID do Produto na Cakto *</Label>
                  <Input
                    value={editing.cakto_product_id ?? ""}
                    onChange={e => setEditing({ ...editing, cakto_product_id: e.target.value })}
                    placeholder="ex: 12345"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do Produto</Label>
                  <Input
                    value={editing.cakto_product_nome ?? ""}
                    onChange={e => setEditing({ ...editing, cakto_product_nome: e.target.value })}
                    placeholder="Identificação interna"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select
                    value={editing.tipo ?? "plan"}
                    onValueChange={v => setEditing({ ...editing, tipo: v, ref_id: undefined })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan">Plano</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vinculado a *</Label>
                  <Select
                    value={editing.ref_id ?? ""}
                    onValueChange={v => setEditing({ ...editing, ref_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {refOptions.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.nome}{o.slug ? ` (${o.slug})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <Label>Ativo</Label>
                  <Switch
                    checked={editing.ativo ?? true}
                    onCheckedChange={v => setEditing({ ...editing, ativo: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Produto Cakto</TableHead>
                <TableHead>Nome do Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vinculado a</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maps.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum mapeamento cadastrado.</TableCell></TableRow>
              )}
              {maps.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.cakto_product_id}</TableCell>
                  <TableCell>{m.cakto_product_nome || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.tipo}</Badge>
                  </TableCell>
                  <TableCell>{refNames[m.ref_id] || <span className="text-muted-foreground font-mono text-xs">{m.ref_id}</span>}</TableCell>
                  <TableCell>
                    <Switch checked={m.ativo} onCheckedChange={() => toggleAtivo(m)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SEÇÃO C: Upsells / Produtos Avulsos */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Upsells / Produtos Avulsos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Produtos vendidos separadamente — grupo VIP, mentoria, sinais, saldo demo, etc.
            </p>
          </div>
          <Dialog open={upOpen} onOpenChange={setUpOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewUpsell} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />Novo Upsell
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{upEditing.id ? "Editar Upsell" : "Novo Upsell"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input
                    value={upEditing.nome ?? ""}
                    onChange={e => setUpEditing({ ...upEditing, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Textarea
                    rows={2}
                    value={upEditing.descricao ?? ""}
                    onChange={e => setUpEditing({ ...upEditing, descricao: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select
                    value={upEditing.tipo ?? "outro"}
                    onValueChange={v => setUpEditing({ ...upEditing, tipo: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo_balance">Demo de Saldo</SelectItem>
                      <SelectItem value="vip">Grupo VIP</SelectItem>
                      <SelectItem value="sinais">Sala de Sinais</SelectItem>
                      <SelectItem value="mentoria">Mentoria</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="97.00"
                      value={upEditing.valor ?? ""}
                      onChange={e => setUpEditing({ ...upEditing, valor: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Label de preço</Label>
                    <Input
                      placeholder="R$ 97/mês"
                      value={upEditing.preco_label ?? ""}
                      onChange={e => setUpEditing({ ...upEditing, preco_label: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>URL do Checkout Cakto</Label>
                  <Input
                    placeholder="https://pay.cakto.com.br/..."
                    value={upEditing.checkout_url ?? ""}
                    onChange={e => setUpEditing({ ...upEditing, checkout_url: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <Label>Recorrente (assinatura)</Label>
                  <Switch
                    checked={upEditing.is_recorrente ?? false}
                    onCheckedChange={v => setUpEditing({ ...upEditing, is_recorrente: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <Label>Ativo</Label>
                  <Switch
                    checked={upEditing.ativo ?? true}
                    onCheckedChange={v => setUpEditing({ ...upEditing, ativo: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveUpsell} disabled={upSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {upSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Label Preço</TableHead>
                <TableHead>Recorrente</TableHead>
                <TableHead>URL Checkout</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upsellRows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum upsell cadastrado.</TableCell></TableRow>
              )}
              {upsellRows.map(u => {
                const Icon = u.tipo === "demo_balance" ? FlaskConical
                  : u.tipo === "vip" ? Crown
                  : u.tipo === "sinais" ? TrendingUp
                  : u.tipo === "mentoria" ? GraduationCap
                  : Gift;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        {u.nome}
                      </span>
                    </TableCell>
                    <TableCell><Badge variant="outline">{u.tipo}</Badge></TableCell>
                    <TableCell>{u.valor != null ? `R$ ${Number(u.valor).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-xs">{u.preco_label || "—"}</TableCell>
                    <TableCell>{u.is_recorrente ? <Badge>Sim</Badge> : <span className="text-muted-foreground">Não</span>}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs">
                      {u.checkout_url ? (
                        <a href={u.checkout_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {u.checkout_url}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!u.ativo} onCheckedChange={() => toggleUpsellAtivo(u)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditUpsell(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUpsell(u)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SEÇÃO D: Marketplace — Submissões de Estratégias */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader>
          <div>
            <CardTitle className="text-base">Marketplace — Submissões de Estratégias</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Revise e aprove estratégias enviadas por usuários para venda.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { v: "all", label: "Todas" },
              { v: "pending", label: "Pendentes" },
              { v: "approved", label: "Aprovadas" },
              { v: "rejected", label: "Rejeitadas" },
            ].map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setMktFilter(opt.v)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  mktFilter === opt.v
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 text-muted-foreground hover:bg-card"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Estratégia</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead>Winrate</TableHead>
                <TableHead>Preço sugerido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mktRows.filter(m => mktFilter === "all" || m.status === mktFilter).length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma submissão.</TableCell></TableRow>
              )}
              {mktRows.filter(m => mktFilter === "all" || m.status === mktFilter).map(m => {
                const badgeCls =
                  m.status === "approved" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" :
                  m.status === "rejected" ? "bg-red-500/15 text-red-300 border-red-500/40" :
                  "bg-amber-500/15 text-amber-300 border-amber-500/40";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{fmtDateTime(m.created_at)}</TableCell>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{m.user_id.slice(0, 8)}…</TableCell>
                    <TableCell>{m.preview_trades ?? "—"}</TableCell>
                    <TableCell>{m.preview_winrate != null ? `${Number(m.preview_winrate).toFixed(1)}%` : "—"}</TableCell>
                    <TableCell>{m.preco_sugerido != null ? `R$ ${Number(m.preco_sugerido).toFixed(2)}` : "—"}</TableCell>
                    <TableCell><Badge className={badgeCls}>{m.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {m.status === "pending" && (
                        <div className="inline-flex gap-1">
                          <Button size="sm" onClick={() => openApprove(m)} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1">
                            <Check className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openReject(m)} className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-1">
                            <XIcon className="h-3.5 w-3.5" /> Rejeitar
                          </Button>
                        </div>
                      )}
                      {m.status === "approved" && m.checkout_url && (
                        <a href={m.checkout_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> Checkout
                        </a>
                      )}
                      {m.status === "rejected" && (
                        <span className="text-xs text-muted-foreground" title={m.admin_notes ?? ""}>
                          {m.admin_notes ? (m.admin_notes.length > 40 ? m.admin_notes.slice(0, 40) + "…" : m.admin_notes) : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SEÇÃO B: Eventos */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Eventos Recebidos da Cakto</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Últimos 50 webhooks recebidos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearEvents} disabled={evClearing || evLoading} className="gap-2 text-destructive hover:text-destructive">
              {evClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Limpar
            </Button>
            <Button variant="outline" size="sm" onClick={loadEvents} disabled={evLoading || evClearing} className="gap-2">
              {evLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum evento recebido ainda.</TableCell></TableRow>
              )}
              {events.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{fmtDateTime(e.processado_em)}</TableCell>
                  <TableCell className="font-medium">{e.evento}</TableCell>
                  <TableCell className="text-xs">{e.cakto_email || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{e.cakto_order_id || "—"}</TableCell>
                  <TableCell>{statusBadge(e.status)}</TableCell>
                  <TableCell>
                    {e.erro ? (
                      <span className="inline-flex items-center gap-1 text-red-400" title={e.erro}>
                        <AlertCircle className="h-4 w-4" />
                        <span className="max-w-[200px] truncate text-xs">{e.erro}</span>
                      </span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Aprovar */}
      <Dialog open={mktApproveDialog} onOpenChange={setMktApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar estratégia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>URL do Checkout Cakto *</Label>
              <Input
                placeholder="https://pay.cakto.com.br/..."
                value={mktCheckoutUrl}
                onChange={e => setMktCheckoutUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Comissão IA Vingativa (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={mktComissao}
                onChange={e => setMktComissao(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O criador receberá {Math.max(0, 100 - (parseInt(mktComissao) || 0))}% das vendas como coprodutor.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMktApproveDialog(false)}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={mktSaving || !mktCheckoutUrl.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {mktSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejeitar */}
      <Dialog open={mktRejectDialog} onOpenChange={setMktRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar submissão</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Textarea
              rows={3}
              placeholder="Ex.: estratégia com poucos trades, descrição insuficiente..."
              value={mktAdminNotes}
              onChange={e => setMktAdminNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMktRejectDialog(false)}>Cancelar</Button>
            <Button onClick={handleReject} disabled={mktSaving} className="bg-red-600 hover:bg-red-500 text-white">
              {mktSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Auditoria Tab ───────────────────────────────────────────────────────────

type AuditRow = {
  op_user_id: string;
  symbol: string | null;
  direction: string | null;
  uo_result: string | null;
  uo_pnl: number | null;
  uo_open_at: string | null;
  te_result: string | null;
  te_pnl: number | null;
  te_happened_at: string | null;
  status: string;
};

const STATUS_AUDIT: Record<string, { label: string; cls: string }> = {
  ok: { label: "OK", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  sem_confirmacao_corretora: { label: "Sem confirmação", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  resultado_diverge: { label: "Diverge", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const AuditoriaTab = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const runAudit = async () => {
    setLoading(true);
    try {
      const [auditRes, usersRes] = await Promise.all([
        (supabase.rpc as any)("admin_ops_cross_check"),
        supabase.rpc("admin_list_users"),
      ]);
      if (auditRes.error) { toast.error(`Erro no RPC: ${auditRes.error.message}`); setLoading(false); return; }
      if (usersRes.data) {
        const map: Record<string, string> = {};
        ((usersRes.data as AuthUserRow[]) ?? []).forEach(u => { map[u.user_id] = u.email; });
        setUserMap(map);
      }
      setRows((auditRes.data ?? []) as AuditRow[]);
      if ((auditRes.data ?? []).length === 0) toast.info("Nenhuma operação encontrada em user_operations.");
    } catch (e: any) {
      toast.error(`Erro inesperado: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter);
  const counts = {
    ok: rows.filter(r => r.status === "ok").length,
    sem: rows.filter(r => r.status === "sem_confirmacao_corretora").length,
    div: rows.filter(r => r.status === "resultado_diverge").length,
  };

  const fmt = (ts: string | null) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Auditoria de Operações</h2>
          <p className="text-sm text-muted-foreground">Cruza bot (user_operations) × corretora (trade_events)</p>
        </div>
        <Button onClick={runAudit} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Executar Auditoria
        </Button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pb-4 pt-5">
                <div className="text-3xl font-black text-emerald-400">{counts.ok}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Confirmadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-5">
                <div className="text-3xl font-black text-amber-400">{counts.sem}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Sem confirmação</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-5">
                <div className="text-3xl font-black text-red-400">{counts.div}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Resultado diverge</div>
              </CardContent>
            </Card>
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({rows.length})</SelectItem>
              <SelectItem value="ok">OK ({counts.ok})</SelectItem>
              <SelectItem value="sem_confirmacao_corretora">Sem confirmação ({counts.sem})</SelectItem>
              <SelectItem value="resultado_diverge">Diverge ({counts.div})</SelectItem>
            </SelectContent>
          </Select>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Dir.</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Resultado Bot</TableHead>
                  <TableHead>PnL Bot</TableHead>
                  <TableHead>Resultado Corretora</TableHead>
                  <TableHead>PnL Corr.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => {
                  const s = STATUS_AUDIT[r.status] ?? { label: r.status, cls: "bg-muted text-muted-foreground border-border" };
                  return (
                    <TableRow key={i}>
                      <TableCell className="max-w-[180px] truncate font-mono text-xs" title={r.op_user_id}>
                        {userMap[r.op_user_id] ?? `${r.op_user_id.slice(0, 8)}…`}
                      </TableCell>
                      <TableCell className="font-semibold">{r.symbol ?? "—"}</TableCell>
                      <TableCell>
                        {r.direction && (
                          <Badge variant="outline" className={r.direction === "call" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}>
                            {r.direction.toUpperCase()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{fmt(r.uo_open_at)}</TableCell>
                      <TableCell>
                        {r.uo_result && (
                          <Badge variant="outline" className={r.uo_result === "win" ? "border-emerald-500/40 text-emerald-400" : r.uo_result === "loss" ? "border-red-500/40 text-red-400" : "border-border text-muted-foreground"}>
                            {r.uo_result}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={r.uo_pnl !== null ? (r.uo_pnl > 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400") : "text-muted-foreground"}>
                        {r.uo_pnl !== null ? `${r.uo_pnl > 0 ? "+" : ""}${r.uo_pnl.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        {r.te_result
                          ? <Badge variant="outline" className={r.te_result === "win" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}>{r.te_result}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={r.te_pnl !== null ? (r.te_pnl > 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400") : "text-muted-foreground"}>
                        {r.te_pnl !== null ? `${r.te_pnl > 0 ? "+" : ""}${r.te_pnl.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {rows.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <FlaskConical className="h-10 w-10 opacity-20" />
          <p className="text-sm">Clique em "Executar Auditoria" para carregar os dados.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
