import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Plan from "./pages/Plan";
import CheckIn from "./pages/CheckIn";
import Progress from "./pages/Progress";
import Values from "./pages/Values";
import Gratitude from "./pages/Gratitude";
import Journal from "./pages/Journal";
import Tools from "./pages/Tools";
import Reminders from "./pages/Reminders";
import Message from "./pages/Message";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/values" element={<Values />} />
            <Route path="/gratitude" element={<Gratitude />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/message" element={<Message />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
