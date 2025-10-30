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
  const [confirmPassword, setConfirmPassword] = useState("");
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
        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return false;
        }
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

        toast.success("¡Cuenta creada! Redirigiendo...");
        // Auto-login after signup since email is auto-confirmed
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
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
                      <Label htmlFor="fullName" className="pl-4">Nombre de pila:</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Solo tu nombre"
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

                  <div className="space-y-2">
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

                  {!isLogin && (
                    <div className="space-y-2 pb-[35px]">
                      <Label htmlFor="confirmPassword" className="pl-4">Confirmar contraseña:</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!isLogin}
                        disabled={loading}
                        className="rounded-xl"
                      />
                    </div>
                  )}

                  {isLogin && <div className="pb-[35px]" />}

                  <Button
                    type="submit"
                    className="w-full rounded-xl text-left pl-4"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? "Procesando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
                  </Button>
                </form>

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