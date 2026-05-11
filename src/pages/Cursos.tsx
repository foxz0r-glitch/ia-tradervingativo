import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Lock, Play, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  panda_video_id: string;
  module: string | null;
  ordem: number | null;
};

type Plan = {
  plan_slug: string;
  plan_nome: string;
  max_estrategias: number;
  is_vitalicio: boolean;
  is_recorrente: boolean;
  status: string;
  expires_at: string | null;
};

const Cursos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<Plan | null>(null);
  const [playing, setPlaying] = useState<Course | null>(null);

  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      try {
        // getSession() reads from localStorage cache — avoids auth lock on tab refocus
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          if (!canceled) setLoading(false);
          return;
        }

        const [planRes, allRes, accRes] = await Promise.all([
          supabase.rpc("get_user_plan", { p_user_id: userId }).then(r => r, () => ({ data: null, error: null })),
          supabase
            .from("courses")
            .select("id, title, description, thumbnail_url, panda_video_id, module, ordem")
            .eq("published", true)
            .order("ordem", { ascending: true })
            .then(r => r, () => ({ data: null, error: null })),
          supabase.rpc("get_user_courses", { p_user_id: userId }).then(r => r, () => ({ data: null, error: null })),
        ]);

        if (canceled) return;
        const planRow = (planRes.data as Plan[] | null)?.[0] ?? null;
        setPlan(planRow);
        setCourses((allRes.data as Course[] | null) ?? []);
        setAccessibleIds(
          new Set(((accRes.data as { id: string }[] | null) ?? []).map((c) => c.id)),
        );
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchData();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !canceled) {
        setLoading(true);
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      canceled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const accessibleCount = courses.filter((c) => accessibleIds.has(c.id)).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Aulas</h1>
          {plan ? (
            <Badge className="text-xs uppercase tracking-wider">
              Plano {plan.plan_nome}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs uppercase tracking-wider">
              Sem plano
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Carregando..."
            : `${accessibleCount} ${accessibleCount === 1 ? "aula disponível" : "aulas disponíveis"} no seu plano`}
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Nenhuma aula publicada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const accessible = accessibleIds.has(course.id);
            return (
              <Card
                key={course.id}
                className="group relative overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:border-primary/40 hover:shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)]"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-background">
                      <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {course.module && (
                    <Badge
                      variant="secondary"
                      className="absolute left-2 top-2 bg-background/80 text-[10px] uppercase tracking-wider backdrop-blur"
                    >
                      {course.module}
                    </Badge>
                  )}
                  {!accessible && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                      <Button size="sm" onClick={() => navigate("/pricing")}>
                        Ver planos
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <h3 className="line-clamp-1 text-base font-semibold">{course.title}</h3>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {course.description ?? "Sem descrição"}
                  </p>
                  {accessible && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setPlaying(course)}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Assistir
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{playing?.title}</DialogTitle>
          </DialogHeader>
          {playing && (
            <iframe
              src={`https://player-vz-762d7dd0-9ab.tv.pandavideo.com.br/embed/?v=${playing.panda_video_id}`}
              style={{ border: "none" }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-lg"
              title={playing.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cursos;
