import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Create dynamic schemas using translations
  const getEmailSchema = () => z.string().email(t("auth.invalidEmail"));
  const getPasswordSchema = () => z.string()
    .min(8, t("auth.passwordMinLength"))
    .regex(/[A-Z]/, t("auth.passwordUppercase"))
    .regex(/[a-z]/, t("auth.passwordLowercase"))
    .regex(/[0-9]/, t("auth.passwordNumber"))
    .regex(/[^A-Za-z0-9]/, t("auth.passwordSpecial"));

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const validateInputs = () => {
    try {
      getEmailSchema().parse(email);
      if (!isLogin) {
        getPasswordSchema().parse(password);
        if (password !== confirmPassword) {
          toast.error(t("auth.passwordsNoMatch"));
          return false;
        }
      } else {
        z.string().min(1, t("auth.passwordRequired")).parse(password);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      getEmailSchema().parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t("auth.checkEmail"));
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error) {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(t("auth.invalidCredentials"));
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(t("auth.welcomeBackToast"));
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error(t("auth.emailAlreadyRegistered"));
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success(t("auth.accountCreated"));
        // Auto-login after signup since email is auto-confirmed
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin && !isForgotPassword && (
          <div className="mb-3 pl-[25px]">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Heart className="h-10 w-10" />
              <span className="text-4xl font-bold">rehabp.org</span>
            </Link>
          </div>
        )}
        
        {(!isLogin || isForgotPassword) && (
          <div className="mb-3 pl-[25px]">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Heart className="h-10 w-10" />
              <span className="text-4xl font-bold">rehabp.org</span>
            </Link>
          </div>
        )}
        
        {isForgotPassword && (
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">{t("auth.recoverPasswordTitle")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("auth.recoverPasswordDescription")}
            </p>
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="pl-4">{isForgotPassword ? t("auth.recoverPasswordTitle") : isLogin ? t("auth.signInTitle") : t("auth.signUpTitle")}</CardTitle>
            {!isLogin && !isForgotPassword && (
              <CardDescription className="pl-4">
                {t("auth.signUpDescription")}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="pl-4">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? t("auth.sending") : t("auth.sendRecoveryLink")}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                  }}
                  disabled={loading}
                >
                  {t("auth.backToLogin")}
                </Button>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="pl-4">{t("auth.fullName")}</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t("auth.fullNamePlaceholder")}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={!isLogin}
                        disabled={loading}
                        className="rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="pl-4">{t("auth.emailLabel")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between pl-4">
                      <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-primary hover:underline pr-4"
                          disabled={loading}
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="rounded-xl"
                    />
                  </div>

                  {!isLogin && (
                    <div className="space-y-2 pb-[25px]">
                      <Label htmlFor="confirmPassword" className="pl-4">{t("auth.confirmPassword")}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t("auth.confirmPasswordPlaceholder")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!isLogin}
                        disabled={loading}
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground pl-4">
                        {t("auth.passwordRequirements")}
                      </p>
                    </div>
                  )}

                  {isLogin && <div className="pb-[25px]" />}

                  <Button
                    type="submit"
                    className="w-full rounded-xl text-left pl-4"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? t("auth.processing") : isLogin ? t("auth.signInTitle") : t("auth.createAccount")}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {isLogin ? t("auth.dontHaveAccount") : t("auth.alreadyHaveAccount")}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsLogin(!isLogin)}
                    disabled={loading}
                  >
                    {isLogin ? t("auth.createNewAccount") : t("auth.signInTitle")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.termsText")}
        </p>
      </div>
    </div>
  );
}