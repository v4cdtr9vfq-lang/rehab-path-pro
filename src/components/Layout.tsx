import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <div className="pt-20 lg:pt-6">
          <main className="container mx-auto px-4 lg:px-8 max-w-6xl">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
