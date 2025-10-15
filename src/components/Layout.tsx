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
        <div className="pt-16 lg:pt-0">
          <main className="container mx-auto p-4 lg:p-8 max-w-6xl">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
