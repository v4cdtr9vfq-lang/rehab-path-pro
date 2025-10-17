import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";
import { SUBSCRIPTION_PLANS, useSubscription } from "@/contexts/SubscriptionContext";

export default function TrialEnded() {
  const navigate = useNavigate();
  const { createCheckoutSession } = useSubscription();

  const handleUpgrade = async (priceId: string) => {
    await createCheckoutSession(priceId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-4xl font-bold">Tu periodo de prueba ha terminado</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gracias por usar rehabp.org durante estos 40 días. Para continuar disfrutando de todas las funciones, 
            actualiza tu plan ahora.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Monthly Plan */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Plan mensual</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">6€</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2">
                  <span className="text-xl text-primary flex-shrink-0">✅</span>
                  <span>Acceso completo a todas las funciones.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl text-primary flex-shrink-0">✅</span>
                  <span>Chat comunitario.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl text-primary flex-shrink-0">✅</span>
                  <span>Seguimiento personalizado.</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleUpgrade(SUBSCRIPTION_PLANS.monthly.priceId)}
              >
                Actualizar Plan
              </Button>
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-primary bg-primary/5 hover:border-primary/60 transition-all relative flex flex-col">
            <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full font-semibold">
              Ahorra 50%
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Plan anual</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">30€</span>
                <span className="text-muted-foreground">/año</span>
              </div>
              <p className="text-sm text-muted-foreground">Solo 2.5€/mes</p>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2">
                  <span className="text-xl text-primary flex-shrink-0">✅</span>
                  <span>Todo lo del plan mensual.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl text-primary flex-shrink-0">✅</span>
                  <span>Ahorra 42€ al año.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xl text-primary flex-shrink-0">✅</span>
                  <span>Mejor valor por tu dinero.</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleUpgrade(SUBSCRIPTION_PLANS.annual.priceId)}
              >
                Actualizar Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>¿Necesitas ayuda? Contáctanos en info@neurotropy.com</p>
        </div>
      </div>
    </div>
  );
}
