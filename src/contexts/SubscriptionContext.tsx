import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionContextType {
  subscribed: boolean;
  plan: "free" | "monthly" | "annual";
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckoutSession: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const SUBSCRIPTION_PLANS = {
  monthly: {
    priceId: "price_1R9HPaJ33TdczwTh33zECRGk",
    productId: "prod_MuQRCQQMestENX",
    name: "Plan Mensual",
    price: "6€/mes",
  },
  annual: {
    priceId: "price_1SIvT0J33TdczwThHexIVEeY",
    productId: "prod_TFQJC2LMMiobA6",
    name: "Plan Anual",
    price: "30€/año",
  },
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [subscribed, setSubscribed] = useState(false);
  const [plan, setPlan] = useState<"free" | "monthly" | "annual">("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscribed(false);
        setPlan("free");
        setSubscriptionEnd(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;

      setSubscribed(data.subscribed || false);
      setPlan(data.plan || "free");
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Error",
        description: "No se pudo verificar el estado de la suscripción",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir el portal de gestión",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          checkSubscription();
        } else if (event === "SIGNED_OUT") {
          setSubscribed(false);
          setPlan("free");
          setSubscriptionEnd(null);
        }
      }
    );

    // Refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscribed,
        plan,
        subscriptionEnd,
        loading,
        checkSubscription,
        createCheckoutSession,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

export { SUBSCRIPTION_PLANS };
