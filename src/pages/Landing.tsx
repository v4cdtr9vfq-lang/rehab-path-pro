import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Target, TrendingUp, Users, Heart, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useSolarTheme } from "@/hooks/useSolarTheme";

export default function Landing() {
  useSolarTheme();
  const benefits = [{
    icon: Target,
    title: "Seguimiento de progreso",
    description: "Monitorea tu abstinencia día a día y celebra cada logro alcanzado"
  }, {
    icon: Calendar,
    title: "Check-In Diario",
    description: "Registra tu estado emocional y mantén el control de tu recuperación"
  }, {
    icon: TrendingUp,
    title: "Metas personalizadas",
    description: "Establece y alcanza objetivos adaptados a tu proceso de recuperación"
  }, {
    icon: Users,
    title: "Red de apoyo",
    description: "Conecta con tu red de soporte cuando más lo necesites"
  }];
  const steps = [{
    number: "1",
    title: "Regístrate",
    description: "Crea tu cuenta en segundos."
  }, {
    number: "2",
    title: "Configura",
    description: "Personaliza tu perfil y fecha de inicio en recuperación."
  }, {
    number: "3",
    title: "Progresa",
    description: "Sigue tu recuperación día a día."
  }];
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-blue/10 border border-sky-blue/30">
              <span className="text-base font-semibold text-foreground">Un aliado en la rehabilitación</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              La recuperación,<br />
              <span className="text-primary">está en  tus manos</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              <span className="inline-flex items-center gap-2">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="font-bold">rehabp.org</span>
              </span> te acompaña en cada paso de tu proceso de crecimiento con herramientas diseñadas para mantenerte motivado y enfocado.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="text-lg px-8 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform">Comienza tu proceso</Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 inline-flex items-center justify-center flex-wrap">
              <span className="mr-3">¿Por qué</span>
              <span className="inline-flex items-center gap-2">
                <Heart className="h-10 w-10 text-primary" />
                <span>rehabp.org?</span>
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Herramientas diseñadas específicamente para tu proceso de recuperación de las dependecias.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return <Card key={index} className="border-border/50 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Cómo funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Comienza tu viaje en 3 simples pasos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => <div key={index} className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-lg">{step.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center gap-2 mb-4 text-3xl">
                🏅🏅🏅🏅🏅
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed">
                "La confianza se construye con consistencia. rehabp.org me ha ayudado a mantener el enfoque día a día"
              </blockquote>
              <p className="text-muted-foreground text-lg">- Usuario de rehabp.org</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Comienza tu viaje hoy
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Únete a miles de personas que ya están transformando sus vidas
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="text-lg px-12 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform">
              Registrarse gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 rehabp.org. Tu privacidad y recuperación son nuestra prioridad.
          </p>
        </div>
      </footer>
    </div>;
}