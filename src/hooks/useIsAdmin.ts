import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkRole = async (userId: string) => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!cancelled) {
        setIsAdmin(!error && data === true);
        setLoading(false);
      }
    };

    const init = async () => {
      // getSession() reads from localStorage cache — does NOT acquire the auth lock
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      await checkRole(session.user.id);
    };

    init();

    // Use session from event directly — never call getSession() inside this callback
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session?.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      checkRole(session.user.id);
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        setLoading(true);
        init();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return { isAdmin, loading };
}
