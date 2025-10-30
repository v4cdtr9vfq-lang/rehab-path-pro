import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Target, TrendingUp, Users, Heart, Calendar } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSolarTheme } from "@/hooks/useSolarTheme";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export default function Landing() {
  useSolarTheme();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  // Support ?lang=en or ?lang=es parameter to force language
  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam && ['en', 'es'].includes(langParam)) {
      i18n.changeLanguage(langParam);
    }
    // Save detected or forced language to localStorage
    const currentLang = i18n.language;
    localStorage.setItem('i18nextLng', currentLang);
  }, [searchParams, i18n]);
  
  const benefits = [{
    icon: Target,
    title: t("landing.benefit1Title"),
    description: t("landing.benefit1Description")
  }, {
    icon: Calendar,
    title: t("landing.benefit2Title"),
    description: t("landing.benefit2Description")
  }, {
    icon: TrendingUp,
    title: t("landing.benefit3Title"),
    description: t("landing.benefit3Description")
  }, {
    icon: Users,
    title: t("landing.benefit4Title"),
    description: t("landing.benefit4Description")
  }];
  const steps = [{
    number: "1",
    title: t("landing.step1Title"),
    description: t("landing.step1Description")
  }, {
    number: "2",
    title: t("landing.step2Title"),
    description: t("landing.step2Description")
  }, {
    number: "3",
    title: t("landing.step3Title"),
    description: t("landing.step3Description")
  }];
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30">
              <span className="text-base font-semibold text-primary">{t("landing.badge")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              {t("landing.heroTitle")}<br />
              <span className="text-primary">{t("landing.heroTitleHighlight")}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              <span className="inline-flex items-center gap-1 relative -left-1 top-0.5">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="font-bold">rehabp.org</span>
              </span> {t("landing.heroDescription")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="text-lg px-8 py-6 rounded-2xl hover:scale-105 transition-transform">{t("landing.startButton")}</Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl">
                  {t("landing.loginButton")}
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
              <span className="mr-3">{t("landing.whyTitle")}</span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-10 w-10 text-primary" />
                <span>rehabp.org?</span>
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("landing.whySubtitle")}</p>
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
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("landing.howItWorksSubtitle")}
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
      <section className="py-20 bg-sky-blue/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-2 border-sky-blue/30 bg-sky-blue/5">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center gap-2 mb-4 text-3xl">
                🏅🏅🏅🏅🏅
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed">
                "{t("landing.testimonialQuote")}"
              </blockquote>
              <p className="text-muted-foreground text-lg">- {t("landing.testimonialAuthor")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("landing.ctaSubtitle")}
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="text-lg px-12 py-6 rounded-2xl hover:scale-105 transition-transform">
              {t("landing.ctaButton")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            {t("landing.footerText")}
          </p>
        </div>
      </footer>
    </div>;
}