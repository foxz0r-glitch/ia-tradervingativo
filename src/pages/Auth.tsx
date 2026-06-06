// Auth page (sign in / sign up). Wired to Lovable Cloud auth.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthFooter } from "@/components/AuthFooter";
import { BrandLockup } from "@/components/BrandLockup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";

const PROXY_URL = "https://bot.tradervingativo.pro/api/register";

// Formats a Brazilian mobile number progressively as the user types.
// Output: "(XX) XXXXX-XXXX" (max 11 digits).
const formatBrPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [casatradeExistsOpen, setCasatradeExistsOpen] = useState(false);

  // If already signed in, jump to dashboard.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) navigate("/dashboard");
      },
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    if (!email || !password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos");
      return;
    }
    toast.success("Bem-vindo!");
    navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirmPassword") || "");
    const firstName = String(fd.get("firstName") || "");
    const lastName = String(fd.get("lastName") || "");
    if (!firstName || !lastName || !email || !password || !confirm) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);

    // Step 1: Register on CasaTrade FIRST — Supabase account only created if this succeeds
    let casatradeResult: any = null;
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          country_code: "BR",
          turnstile_token: "",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.message || body?.error || "";
        const isExisting = /j[aá]\s*(existe|cadastrad)|already.exist|email.*exist|exist.*email|already.registered/i.test(msg);
        if (isExisting) {
          setCasatradeExistsOpen(true);
          setLoading(false);
          return;
        }
        toast.error(msg || "Cadastro na corretora falhou. Verifique seus dados.");
        setLoading(false);
        return;
      }
      casatradeResult = body;
    } catch {
      toast.error("Não foi possível conectar à corretora. Tente novamente.");
      setLoading(false);
      return;
    }

    // Step 2: CasaTrade accepted → create Supabase account
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { first_name: firstName, last_name: lastName, country: "Brasil", whatsapp: `+55${whatsapp.replace(/\D/g, "")}` },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Step 3: Save credentials (including CasaTrade token returned in step 1)
    const { data: { session: newSession } } = await supabase.auth.getSession();
    const user = newSession?.user;
    if (user) {
      const token = casatradeResult?.token || casatradeResult?.data?.token;
      const userId = casatradeResult?.user_id || casatradeResult?.data?.user_id;
      const ssid = casatradeResult?.ssid || casatradeResult?.data?.ssid;
      await supabase.from('user_credentials').insert({
        id: user.id,
        casatrade_email: email,
        casatrade_password: password,
        casatrade_token: ssid || token || null,
        casatrade_user_id: userId || null,
        casatrade_ssid: ssid || null,
      });
    }

    setLoading(false);
    toast.success("Conta criada! Redirecionando...");
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="animate-float"><BrandLockup size={64} /></div>
          </div>

          <Card className="border-border/50 bg-card/80 shadow-[var(--shadow-card)] backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl">
                IA Vingativa
              </CardTitle>
              <CardDescription className="text-center">
                Play Hard, Go Pro 🔥
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "signin" | "signup")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                </TabsList>

                {/* Sign In */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">E-mail</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Senha</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="mb-10 mt-8 w-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/90"
                    >
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input id="firstName" name="firstName" placeholder="João" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input id="lastName" name="lastName" placeholder="Silva" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <div className="flex gap-2">
                        <Input
                          value="+55"
                          disabled
                          className="w-16 text-center"
                        />
                        <Input
                          id="whatsapp"
                          name="whatsapp"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="(11) 99999-9999"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(formatBrPhone(e.target.value))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="mb-10 mt-8 w-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/90"
                    >
                      {loading ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <AuthFooter />

      <Dialog open={casatradeExistsOpen} onOpenChange={setCasatradeExistsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>E-mail já cadastrado na CasaTrade</DialogTitle>
            <DialogDescription>
              Este e-mail já possui uma conta na CasaTrade. Para usar a IA Vingativa, cadastre-se com um e-mail diferente — ou entre em contato com o suporte para regularizar sua situação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setCasatradeExistsOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => window.open("https://wa.me/5511925969015", "_blank")}
              className="gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
            >
              <MessageCircle className="h-4 w-4" />
              Contatar Suporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
