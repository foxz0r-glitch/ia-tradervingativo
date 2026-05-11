import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/virtus-logo.png";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "authed" | "guest">("loading");
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = logo;
    if (img.complete) {
      setLogoLoaded(true);
    } else {
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => setLogoLoaded(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setStatus(data.session ? "authed" : "guest");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setStatus(session ? "authed" : "guest");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          className={`relative flex h-20 w-20 items-center justify-center transition-opacity duration-200 ${
            logoLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-b-primary" />
          <img src={logo} alt="Logo" className="relative h-10 w-10 object-contain" />
        </div>
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
