import { useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserMenu } from "@/components/UserMenu";

import { DepositButton } from "@/components/DepositButton";
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


const queryClient = new QueryClient();

const WHATSAPP_VIP = "https://chat.whatsapp.com/L2O5siAHJQlDcc3DWtwYUZ";
const DRAWER_ITEM: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
  borderRadius: 11, cursor: "pointer", color: "#cfd6dd",
  font: "600 14px 'Sora'", background: "none", border: "none", textAlign: "left", width: "100%",
};

// Layout do dashboard reconstruído do handoff ClaudeDesign (Dashboard.dc.html + DeskNav.dc.html).
// Rail 76px (desktop) + header shell 62px; mobile = header 52px + drawer. Estilos inline exatos do handoff.
// Envolve as 13 rotas autenticadas; o título "COCKPIT DO TRADER" + "Ativar Plano" só aparecem em /dashboard.
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDash = location.pathname === "/dashboard";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const depositRef = useRef<HTMLDivElement>(null);
  // Abre o fluxo de depósito reusando o DepositButton shared (oculto), sem editá-lo — padrão do projeto.
  const openDeposit = () => depositRef.current?.querySelector("button")?.click();
  const openVip = () => window.open(WHATSAPP_VIP, "_blank", "noopener,noreferrer");

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        background: "radial-gradient(120% 90% at 50% 0%, #0c1f14 0%, #060a08 60%)",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {/* GRID de fundo (exato do handoff) — pointer-events:none + z-index:0 (não bloqueia cliques) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(34,197,94,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.04) 1px,transparent 1px)",
          backgroundSize: "38px 38px",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ============ RAIL 76px (DESKTOP) — DeskNav.dc.html ============ */}
      <div
        className="hidden md:flex"
        style={{
          position: "relative",
          zIndex: 1,
          width: 76,
          flex: "none",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0 18px",
          background: "rgba(6,12,8,.6)",
          borderRight: "1px solid rgba(34,197,94,.1)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="IA Vingativa — Dashboard"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 18px -6px rgba(34,197,94,.7)", cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: 22, height: 22, display: "block", filter: "drop-shadow(0 0 5px rgba(26,230,92,.6))" }}>
            <path d="M11 17 L37 17 L50 49 L63 17 L89 17 L50 86 Z" fill="#1AE65C" />
          </svg>
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32, width: "100%", alignItems: "center" }}>
          {/* (1) ROBÔ — ativo → /dashboard */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            aria-label="IA Vingativa"
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#34d77a", boxShadow: "0 0 16px -8px rgba(34,197,94,.7)", cursor: "pointer",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="8" width="16" height="11" rx="3.5" />
              <path d="M12 4.8v3.2" />
              <circle cx="12" cy="3.6" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
              <path d="M9.6 16.3h4.8" />
              <path d="M2.6 12v2.4M21.4 12v2.4" />
            </svg>
          </button>
          {/* (2) PESSOAS → Grupo VIP (WhatsApp) */}
          <button
            type="button"
            onClick={openVip}
            aria-label="Grupo VIP"
            style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#7d9488", background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3" />
              <path d="M3.5 19c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
              <path d="M16 6.3a3 3 0 0 1 0 5.4" />
              <path d="M17.6 14.3c2.1.5 3.9 2.3 3.9 4.7" />
            </svg>
          </button>
          {/* (3) TROFÉU → /ranking */}
          <button
            type="button"
            onClick={() => navigate("/ranking")}
            aria-label="Ranking"
            style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#7d9488", background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4.5h10V9a5 5 0 0 1-10 0V4.5z" />
              <path d="M7 6.4H4.6v1.4A2.8 2.8 0 0 0 7 10.6" />
              <path d="M17 6.4h2.4v1.4A2.8 2.8 0 0 1 17 10.6" />
              <path d="M12 14v3.4" />
              <path d="M9 20h6M9.7 20l.5-2.6h3.6l.5 2.6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ============ ÁREA DIREITA (header shell + children) ============ */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* HEADER 62px — DESKTOP */}
        <div
          className="hidden md:flex"
          style={{ height: 62, flex: "none", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid rgba(34,197,94,.1)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isDash && <span style={{ font: "700 12px 'Sora'", letterSpacing: ".26em", color: "#5d8a70" }}>COCKPIT DO TRADER</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Ordem do handoff (Dashboard.dc.html L43-45): Depositar → Ativar Plano → avatar */}
            <button
              type="button"
              onClick={openDeposit}
              style={{ height: 40, padding: "0 18px", border: "none", borderRadius: 12, background: "#22c55e", color: "#04140a", font: "700 12px 'Sora'", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 0 22px -8px rgba(34,197,94,.8)" }}
            >
              <span style={{ fontSize: 15 }}>+</span> Depositar
            </button>
            {isDash && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("tv:open-activation"))}
                style={{ height: 40, padding: "0 16px", border: "1px solid rgba(34,197,94,.4)", borderRadius: 12, background: "rgba(34,197,94,.06)", color: "#34d77a", font: "700 12px 'Sora'", cursor: "pointer" }}
              >
                Ativar Plano
              </button>
            )}
            <UserMenu />
          </div>
        </div>

        {/* HEADER 52px — MOBILE */}
        <div
          className="flex md:hidden"
          style={{ height: 52, flex: "none", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(34,197,94,.08)" }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9bb0a5", background: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
          >
            ☰
          </button>
          {isDash ? <span style={{ font: "700 11px 'Sora'", letterSpacing: ".28em", color: "#5d8a70" }}>COCKPIT</span> : <span />}
          <UserMenu />
        </div>

        <main style={{ flex: 1, minHeight: 0 }}>{children}</main>
      </div>

      {/* Trigger oculto de depósito — reusa o DepositButton shared sem editá-lo */}
      <div ref={depositRef} className="hidden">
        <DepositButton />
      </div>

      {/* DRAWER mobile — 3 destinos do rail */}
      {drawerOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(2,6,4,.55)", backdropFilter: "blur(2px)" }} />
          <div
            style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: 248, padding: 14,
              background: "radial-gradient(120% 90% at 50% 0%, #102a1b 0%, #08120c 70%)",
              borderRight: "1px solid rgba(34,197,94,.3)",
              boxShadow: "0 24px 60px -18px rgba(0,0,0,.75)",
              display: "flex", flexDirection: "column", gap: 6,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            <button type="button" style={DRAWER_ITEM} onClick={() => { setDrawerOpen(false); navigate("/dashboard"); }}>IA Vingativa</button>
            <button type="button" style={DRAWER_ITEM} onClick={() => { setDrawerOpen(false); openVip(); }}>Grupo VIP</button>
            <button type="button" style={DRAWER_ITEM} onClick={() => { setDrawerOpen(false); navigate("/ranking"); }}>Ranking</button>
          </div>
        </div>
      )}
    </div>
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
