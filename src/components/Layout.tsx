import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { OnboardingManager } from "./onboarding/OnboardingManager";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingManager />
      <Sidebar />
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <div className="pt-[104px] lg:pt-[32px] flex-1">
          <main className="container mx-auto px-[15px] lg:px-8 max-w-6xl pb-12">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
