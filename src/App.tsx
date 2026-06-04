import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUserXP } from "@/hooks/useGamification";

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

import { BrokerAccessButton } from "@/components/BrokerAccessButton";
import { DepositButton } from "@/components/DepositButton";
import { HeaderBalance } from "@/components/HeaderBalance";
import { DashboardBackground } from "@/components/DashboardBackground";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Placeholder from "./pages/Placeholder.tsx";
import Auth from "./pages/Auth.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import Cursos from "./pages/Cursos.tsx";
import Pricing from "./pages/Pricing.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Ranking15 from "./pages/Ranking15.tsx";
import Obrigado from "./pages/Obrigado.tsx";


const AdminHeaderLink = () => {
  const { isAdmin } = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <Link
      to="/admin"
      className="ml-2 hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary transition-all hover:border-primary/60 hover:bg-primary/15 hover:shadow-[0_0_12px_hsl(var(--primary)/0.35)] sm:inline-flex"
      title="Painel Admin"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Admin
    </Link>
  );
};

const queryClient = new QueryClient();

// Layout used for the authenticated/dashboard area (sidebar + header).
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: userXP } = useUserXP();
  const c = userXP?.currentRank.color ?? "hsl(var(--primary))";
  return (
  <SidebarProvider style={{ "--sidebar-width-icon": "4.5rem", "--sidebar-width": "271px" } as React.CSSProperties}>
    <DashboardBackground />
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex w-full flex-1">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 backdrop-blur-md">
            <div
              className="relative flex w-full items-center gap-2 overflow-hidden border-b border-border/50 px-3 py-[5px] sm:px-4"
              style={{
                minHeight: "calc(3.5rem + 10px)",
                background: "hsl(var(--background) / 0.85)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
              <div className="hidden items-center gap-3 sm:flex">
                <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center self-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(139_80%_50%)] opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(139_80%_50%)] shadow-[0_0_12px_hsl(139_80%_50%)]" />
                </span>
                <div className="flex items-center gap-2.5 leading-none">
                  <span className="inline-flex items-center text-[18px] font-extrabold uppercase tracking-[0.22em] leading-none">
                    <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">IA</span>
                    <span className="ml-1.5 bg-gradient-to-r from-[hsl(139_80%_55%)] via-[hsl(139_80%_45%)] to-[hsl(139_80%_38%)] bg-clip-text text-transparent drop-shadow-[0_0_8px_hsl(139_80%_45%/0.45)]">Vingativa</span>
                  </span>
                </div>
                <AdminHeaderLink />
              </div>
              {/* Right-side controls aligned to the main content's max-width (1400px) */}
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 mx-auto flex w-full max-w-[1400px] items-center justify-end px-4 sm:px-6">
                <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
                  <BrokerAccessButton />
                  <DepositButton />
                  <UserMenu />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Standalone auth route (no sidebar/header) */}
          <Route path="/" element={<Auth />} />

          {/* Dashboard area (protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Index />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ferramentas"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Placeholder title="Ferramentas" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/grupo"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                <Placeholder title="Trade Like a Pro" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Admin />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cursos"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Cursos />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Pricing />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Marketplace />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Placeholder title="Acessar Broker" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-content"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Placeholder title="Meu Conteúdo" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Placeholder title="Suporte" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {([
            ["/ranking", Ranking15],
          ] as const).map(([path, Component]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Component />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          ))}
          {/* Página de obrigado (pública — sem login) */}
          <Route path="/obrigado" element={<Obrigado />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
