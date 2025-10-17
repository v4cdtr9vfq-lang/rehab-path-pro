import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
// import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Temporarily disabled - causing page refreshes
  // useInactivityTimeout(3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <div className="pt-20 lg:pt-6 flex-1">
          <main className="container mx-auto px-4 lg:px-8 max-w-6xl pb-12">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
