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

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial (!@#$%^&*)");

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

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
      emailSchema.parse(email);
      // Solo validar requisitos estrictos en registro, no en login
      if (!isLogin) {
        passwordSchema.parse(password);
      } else {
        // En login, solo verificar que no esté vacía
        z.string().min(1, "La contraseña es requerida").parse(password);
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
      emailSchema.parse(email);
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

      toast.success("¡Revisa tu correo! Te hemos enviado un enlace para restablecer tu contraseña");
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
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
            toast.error("Credenciales incorrectas");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("¡Bienvenido de vuelta!");
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
            toast.error("Este email ya está registrado");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("¡Cuenta creada! Revisa tu correo para validar tu cuenta");
        setIsLogin(true);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Error al conectar con Google");
    }
  };

  const handleAppleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Error al conectar con Apple");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin && !isForgotPassword && (
          <div className="mb-5 pl-6">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Heart className="h-10 w-10" />
              <span className="text-4xl font-bold">rehabp.org</span>
            </Link>
          </div>
        )}
        
        {(!isLogin || isForgotPassword) && (
          <div className="mb-5 pl-6">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Heart className="h-10 w-10" />
              <span className="text-4xl font-bold">rehabp.org</span>
            </Link>
          </div>
        )}
        
        {(!isLogin || isForgotPassword) && (
          <div className="text-center space-y-4 mb-8">
            {!isLogin && !isForgotPassword && (
              <h1 className="text-4xl font-bold text-foreground">Comienza tu recuperación</h1>
            )}
            {isForgotPassword && (
              <h1 className="text-4xl font-bold text-foreground">Recuperar contraseña</h1>
            )}
            <p className="text-muted-foreground text-lg">
              {isForgotPassword ? "Te enviaremos un enlace para restablecer tu contraseña" : "Crea tu cuenta gratuita"}
            </p>
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{isForgotPassword ? "Recuperar contraseña" : isLogin ? "Iniciar sesión" : "Registrarse"}</CardTitle>
            {!isLogin && !isForgotPassword && (
              <CardDescription>
                Completa el formulario para crear tu cuenta
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="pl-4">Email</Label>
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
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
                  Volver a iniciar sesión
                </Button>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="pl-4">Nombre completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Juan Pérez"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={!isLogin}
                        disabled={loading}
                        className="rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="pl-4">Email:</Label>
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

                  <div className="space-y-2 pb-[35px]">
                    <div className="flex items-center justify-between pl-4">
                      <Label htmlFor="password">Contraseña:</Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-primary hover:underline pr-4"
                          disabled={loading}
                        >
                          ¿Olvidaste tu contraseña?
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
                    {!isLogin && (
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl text-left pl-4"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? "Procesando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
                  </Button>
                </form>

                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        O continúa con
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="rounded-xl"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAppleAuth}
                      disabled={loading}
                      className="rounded-xl"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
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
                    {isLogin ? "Crear cuenta nueva" : "Iniciar sesión"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  );
}