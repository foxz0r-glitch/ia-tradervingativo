import { useEffect, useState } from "react";
import { Bot, SlidersHorizontal, UsersRound, LineChart, LogOut, Headset, Trophy, BookOpen, Sparkles, Store, ChevronRight, PanelLeft } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import RankProgressPopover from "@/components/RankProgressPopover";

import { useLocation, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import { BrandLockup } from "@/components/BrandLockup";
import { BrokerAccessDialog } from "@/components/BrokerAccessDialog";
import { supabase } from "@/integrations/supabase/client";
import { clearCredsCache } from "@/lib/credsCache";
import { toast } from "sonner";
import { useUserXP, RANKS } from "@/hooks/useGamification";

const RANK_IMAGES: Record<string, string> = {
  "Prata I": "/ranks/rank-prata-1.svg",
  "Prata II": "/ranks/rank-prata-2.svg",
  "Prata III": "/ranks/rank-prata-3.svg",
  "Ouro I": "/ranks/rank-ouro-1.svg",
  "Ouro II": "/ranks/rank-ouro-2.svg",
  "Ouro III": "/ranks/rank-ouro-3.svg",
  "AK I": "/ranks/rank-ak-1.svg",
  "AK II": "/ranks/rank-ak-2.svg",
  "AK Cruzada": "/ranks/rank-ak-cruzada.svg",
  "Xerife": "/ranks/rank-xerife.svg",
  "Águia I": "/ranks/rank-aguia-1.svg",
  "Águia II": "/ranks/rank-aguia-2.svg",
  "Supremo": "/ranks/rank-supremo.svg",
  "Global": "/ranks/rank-global.svg",
};

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const BROKER_URL = "https://trade.casatrade.com/traderoom";

type Item = {
  title: string;
  url: string;
  icon: typeof Bot;
  kind: "internal" | "broker";
};

const items: Item[] = [
  { title: "IA Vingativa", url: "/dashboard", icon: Bot, kind: "internal" },
  { title: "Ferramentas", url: "/ferramentas", icon: SlidersHorizontal, kind: "internal" },
  { title: "Trade Like a Pro", url: "/grupo", icon: UsersRound, kind: "internal" },
  { title: "Ranking", url: "/ranking", icon: Trophy, kind: "internal" },
  { title: "Aulas", url: "/cursos", icon: BookOpen, kind: "internal" },
  { title: "Planos", url: "/pricing", icon: Sparkles, kind: "internal" },
  { title: "Marketplace", url: "/marketplace", icon: Store, kind: "internal" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [brokerOpen, setBrokerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuário");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { data: userXP } = useUserXP();
  const userInitials = (() => {
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();
  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  useEffect(() => {
    const fetchUser = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user;
        const meta = user?.user_metadata;
        const first = meta?.first_name ?? (meta?.full_name ? String(meta.full_name).trim().split(/\s+/)[0] : "") ?? "";
        const last = meta?.last_name ?? "";
        const fullName = [first, last].filter(Boolean).join(" ");
        setUserName(fullName || "Usuário");
        setUserEmail(user?.email ?? "");
        setAvatarUrl(meta?.avatar_url ?? null);
        setMyUserId(user?.id ?? null);
      });
    };
    fetchUser();
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.avatarUrl === null) {
        setAvatarUrl(null);
      } else {
        fetchUser();
      }
    };
    window.addEventListener("avatar-updated", handler);
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata;
          setAvatarUrl(meta?.avatar_url ?? null);
        }
      },
    );
    return () => {
      window.removeEventListener("avatar-updated", handler);
      authSub.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    clearCredsCache();
    // Clear Supabase session from localStorage synchronously so the redirect
    // lands on the login page even if the server-side signOut hangs.
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
    window.location.href = "/";
  };

  const userPlan = "Free";

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border"
        style={{ fontFamily: '"Anthropic Sans", sans-serif' }}
      >
        <SidebarHeader
          className="sticky top-0 z-30 flex-row items-center justify-center gap-2 border-b border-sidebar-border bg-sidebar/60 px-3 py-[5px] backdrop-blur-md group-data-[collapsible=icon]:px-0"
          style={{ minHeight: "calc(3.5rem + 10px)" }}
        >
          <Link
            to="/dashboard"
            aria-label="Ir para o Dashboard"
            className="group/logo flex items-center justify-center"
          >
            {collapsed ? (
              /* Colapsado: V sozinho (mesmo estado que esconde o texto do menu) */
              <img
                src="/symbol-v-solid.svg"
                alt="IA Vingativa"
                className="h-7 w-auto max-w-[40px] shrink-0 cursor-pointer object-contain transition-all duration-500 ease-out group-hover/logo:scale-95 group-hover/logo:opacity-90"
                loading="eager"
              />
            ) : (
              /* Expandido: lockup horizontal */
              <span className="flex items-center transition-all duration-500 ease-out group-hover/logo:scale-95 group-hover/logo:opacity-90">
                <BrandLockup size={42} />
              </span>
            )}
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-3 py-5 group-data-[collapsible=icon]:px-2">
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              {!collapsed && (
                <div className="mb-5 px-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[18px] font-black tracking-tight text-foreground">
                      Painel
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(139_80%_60%)]">
                      / nav
                    </span>
                  </div>
                  <div className="mt-2 h-px w-full bg-gradient-to-r from-[hsl(139_80%_45%/0.55)] via-[hsl(139_80%_45%/0.15)] to-transparent" />
                </div>
              )}

              {/* Floating rail with vertical accent strip */}
              <div className={collapsed ? "" : "relative pl-3"}>
                {!collapsed && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-transparent via-[hsl(0_0%_100%/0.08)] to-transparent"
                  />
                )}

                <SidebarMenu className="gap-1">
                  {items.map((item) => {
                    const active = item.kind === "internal" && isActive(item.url);
                    const inner = (
                      <>
                        {/* gradient border (active + hover) */}
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/menu:opacity-100 ${active ? "!opacity-100" : ""}`}
                          style={{
                            background:
                              "linear-gradient(135deg, hsl(139 80% 55% / 0.6), hsl(139 80% 45% / 0.15) 35%, hsl(0 0% 100% / 0.04) 70%, transparent)",
                            padding: 1,
                            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                          }}
                        />
                        {/* glass fill */}
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                            active
                              ? "bg-[linear-gradient(135deg,hsl(139_80%_45%/0.16),hsl(139_80%_30%/0.04)_55%,transparent)]"
                              : "bg-[hsl(0_0%_100%/0.015)] opacity-0 group-hover/menu:opacity-100 group-hover/menu:bg-[linear-gradient(135deg,hsl(139_80%_45%/0.07),transparent)]"
                          }`}
                        />
                        {/* outer glow (active) */}
                        {!collapsed && active && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -inset-px rounded-2xl opacity-70 blur-[10px]"
                            style={{
                              background: "linear-gradient(120deg, hsl(139 80% 50% / 0.35), transparent 65%)",
                            }}
                          />
                        )}
                        {/* active dot connector to rail */}
                        {!collapsed && active && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -left-[14px] top-1/2 flex h-2 w-2 -translate-y-1/2 items-center justify-center"
                          >
                            <span className="absolute h-2 w-2 animate-ping rounded-full bg-[hsl(139_80%_55%)] opacity-50" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-[hsl(139_80%_60%)] shadow-[0_0_10px_hsl(139_80%_55%)]" />
                          </span>
                        )}

                        {/* Icon */}
                        <span
                          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            active
                              ? "text-[hsl(139_80%_75%)]"
                              : "text-muted-foreground group-hover/menu:text-[hsl(139_80%_72%)] group-hover/menu:scale-105"
                          }`}
                        >
                          <item.icon className={collapsed ? "h-[21px] w-[21px]" : "h-[19px] w-[19px]"} strokeWidth={active ? 2.4 : 1.85} />
                          {active && (
                            <span
                              aria-hidden
                              className="absolute inset-0 -z-10 rounded-xl bg-[radial-gradient(circle_at_center,hsl(139_80%_50%/0.35),transparent_70%)] blur-[2px]"
                            />
                          )}
                        </span>

                        {!collapsed && (
                          <span
                            className={`relative flex-1 truncate text-[15.5px] leading-none tracking-[0.005em] transition-colors duration-300 ${
                              active
                                ? "font-bold text-foreground"
                                : "font-medium text-sidebar-foreground/80 group-hover/menu:text-foreground"
                            }`}
                          >
                            {item.title}
                          </span>
                        )}

                        {!collapsed && active && (
                          <span
                            aria-hidden
                            className="relative ml-auto flex h-5 animate-fade-in items-center rounded-md border border-[hsl(139_80%_50%/0.4)] bg-[hsl(139_80%_45%/0.12)] px-1.5 text-[8.5px] font-black uppercase tracking-[0.18em] text-[hsl(139_80%_72%)] [animation-duration:220ms]"
                          >
                            on
                          </span>
                        )}
                        {!collapsed && !active && (
                          <ChevronRight
                            className="relative ml-auto h-3.5 w-3.5 shrink-0 -translate-x-2 text-[hsl(139_80%_60%)] opacity-0 transition-all duration-300 group-hover/menu:translate-x-0 group-hover/menu:opacity-100"
                            strokeWidth={2.4}
                          />
                        )}
                      </>
                    );
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className="group/menu relative h-12 overflow-visible rounded-2xl !bg-transparent !p-0 text-sm transition-all duration-300 ease-out hover:!bg-transparent group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!w-full data-[active=true]:!bg-transparent"
                        >
                          {item.kind === "broker" ? (
                            <button
                              type="button"
                              onClick={() => setBrokerOpen(true)}
                              className={`relative flex w-full items-center gap-3 rounded-2xl ${collapsed ? "h-10 justify-center px-0" : "h-12 px-2.5"}`}
                            >
                              {inner}
                            </button>
                          ) : (
                            <NavLink
                              to={item.url}
                              end={item.url === "/dashboard"}
                              className={`relative flex items-center gap-3 rounded-2xl ${collapsed ? "h-10 justify-center px-0" : "h-12 px-2.5"}`}
                            >
                              {inner}
                            </NavLink>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-sidebar/40 p-2">
          {collapsed ? (
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Suporte"
                  className="group/support h-10 rounded-lg transition-colors duration-75 hover:bg-primary/10 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!p-0"
                >
                  <a
                    href="https://wa.me/5500000000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors duration-75 group-hover/support:text-primary"
                  >
                    <Headset className="h-5 w-5" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Sair"
                  className="group/logout h-10 rounded-lg transition-colors duration-75 hover:bg-destructive/10 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!p-0"
                >
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors duration-75 group-hover/logout:text-destructive"
                    aria-label="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="flex flex-col gap-2">
              {/* ===================== DESIGN ATUAL ===================== */}
              {userXP && (() => {
                const c = userXP.currentRank.color;
                const rankImg = RANK_IMAGES[userXP.currentRank.name] ?? "/ranks/rank-prata-1.svg";
                const cardInner = (
                  <div
                    className="group/rank rank-card"
                    role="button"
                    tabIndex={0}
                    title="Ver minha patente"
                    style={{
                      position: "relative",
                      padding: "10px 12px 9px",
                      borderRadius: 12,
                      background: `linear-gradient(120deg, ${c}18 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.04) 100%)`,
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${c}10, 0 0 14px -8px ${c}80`,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
                      ["--rank-color" as any]: c,
                    }}
                  >
                    <span
                      aria-hidden
                      className="rank-shine"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "-60%",
                        width: "55%",
                        height: "100%",
                        background: `linear-gradient(115deg, transparent 20%, ${c}55 50%, transparent 80%)`,
                        transform: "skewX(-20deg)",
                        pointerEvents: "none",
                        opacity: 0,
                        transition: "left 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
                      }}
                    />
                    <div aria-hidden style={{
                      position: "absolute", top: 0, right: -20, width: 80, height: "100%",
                      background: `linear-gradient(115deg, transparent, ${c}25, transparent)`,
                      transform: "skewX(-20deg)", pointerEvents: "none",
                    }} />
                    <span
                      aria-hidden
                      className="rank-halo"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(120% 80% at 0% 100%, ${c}28, transparent 60%)`,
                        opacity: 0,
                        transition: "opacity 0.4s ease",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, height: 1,
                        background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
                        opacity: 0.6,
                      }}
                    />
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <img
                        src={rankImg}
                        alt={userXP.currentRank.name}
                        className="rank-img"
                        style={{
                          width: 56, height: 56, flexShrink: 0,
                          objectFit: "contain",
                          filter: `drop-shadow(0 0 10px ${c}90)`,
                          transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), filter 0.4s ease",
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", lineHeight: 1 }}>
                          Patente
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: c, letterSpacing: "0.02em", lineHeight: 1.1, textShadow: `0 0 8px ${c}55`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {userXP.currentRank.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 999, background: `${c}14`, border: `1px solid ${c}33` }}>
                          <span style={{ fontSize: 10, color: c, lineHeight: 1 }}>⚡</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                            Lv {userXP.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ position: "relative", flex: 1, height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ height: "100%", width: `${userXP.progressPercent}%`, background: c, borderRadius: 3, transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)", minWidth: userXP.score > 0 ? 6 : 0, boxShadow: `0 0 8px ${c}cc, inset 0 1px 0 rgba(255,255,255,0.25)` }} />
                      </div>
                      <span style={{ fontSize: 9.5, letterSpacing: "0.05em", color: c, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                        {Math.round(userXP.progressPercent)}%
                      </span>
                    </div>
                    <div style={{ display: "flex", marginTop: 5 }}>
                      {userXP.nextRank ? (
                        <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.45)", lineHeight: 1.2 }}>
                          Próximo:{" "}
                          <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
                            {userXP.nextRank.name}
                          </span>
                          <span style={{ color: "rgba(255,255,255,0.20)", margin: "0 4px" }}>·</span>
                          <span style={{ fontVariantNumeric: "tabular-nums", color: c, fontWeight: 700 }}>
                            {(userXP.nextRank.xpMin - userXP.score).toLocaleString()} pts
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: c, textTransform: "uppercase" }}>
                          Patente Máxima
                        </span>
                      )}
                    </div>
                  </div>
                );
                return (
                  <RankProgressPopover
                    userXP={userXP}
                    userName={userName}
                    side="right"
                    align="end"
                    sideOffset={12}
                    alignOffset={-8}
                    trigger={cardInner}
                  />
                );
              })()}
              <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="group/support relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/30 px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition-all duration-200 hover:border-primary/40 hover:bg-sidebar-accent/60"
                style={{ marginTop: "5px", marginBottom: "5px" }}
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-300 group-hover/support:opacity-100" />
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25 transition-transform duration-200 group-hover/support:scale-105">
                  <Headset className="h-4 w-4" />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm leading-tight" style={{ fontWeight: 510 }}>Suporte</span>
                  <span className="truncate text-[11px] text-muted-foreground" style={{ fontWeight: 430 }}>Estamos online</span>
                </span>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
              </a>

              <div className="-mx-2 h-px bg-sidebar-border/60" />

              <UserMenu
                side="right"
                align="end"
                sideOffset={12}
                alignOffset={-8}
                trigger={
                  <button
                    type="button"
                    className="group relative flex w-[calc(100%+1rem)] items-center gap-3 -mt-2 pt-3 pl-5 pr-3 -ml-2 -mr-2 -mb-2 pb-3 text-left transition-colors duration-150 hover:bg-[#12141A] data-[state=open]:bg-[#12141A]"
                    aria-label="Abrir menu do usuário"
                  >
                    <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-muted text-muted-foreground select-none" style={{ fontSize: '16px', fontWeight: 530, fontFamily: '"Anthropic Sans", sans-serif' }}>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-sidebar-foreground" style={{ fontWeight: 510 }}>
                        {userName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" style={{ fontWeight: 430 }}>
                        Plano {userPlan}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-150 group-hover:text-primary group-data-[state=open]:rotate-90 group-data-[state=open]:text-primary" />
                  </button>
                }
              />
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <BrokerAccessDialog open={brokerOpen} onOpenChange={setBrokerOpen} brokerUrl={BROKER_URL} />

    </>
  );
}
