import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { Suspense } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Plan from "./pages/Plan";
import CheckIn from "./pages/CheckIn";
import Progress from "./pages/Progress";
import Values from "./pages/Values";
import Gratitude from "./pages/Gratitude";
import Journal from "./pages/Journal";
import EmotionJournal from "./pages/EmotionJournal";
import Tools from "./pages/Tools";
import Message from "./pages/Message";
import Chat from "./pages/Chat";
import Community from "./pages/Community";
import DirectChat from "./pages/DirectChat";
import Settings from "./pages/Settings";
import TrialEnded from "./pages/TrialEnded";
import SupportNetwork from "./pages/SupportNetwork";
import Help from "./pages/Help";
import SleepQuality from "./pages/SleepQuality";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <SubscriptionProvider>
        <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/plan" element={
            <ProtectedRoute>
              <Layout>
                <Plan />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/checkin" element={
            <ProtectedRoute>
              <Layout>
                <CheckIn />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <Layout>
                <Progress />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/values" element={
            <ProtectedRoute>
              <Layout>
                <Values />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/gratitude" element={
            <ProtectedRoute>
              <Layout>
                <Gratitude />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/journal" element={
            <ProtectedRoute>
              <Layout>
                <Journal />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/emotion-journal" element={
            <ProtectedRoute>
              <Layout>
                <EmotionJournal />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tools" element={
            <ProtectedRoute>
              <Layout>
                <Tools />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/message" element={
            <ProtectedRoute>
              <Layout>
                <Message />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <Layout>
                <Community />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/direct-chat" element={
            <ProtectedRoute>
              <Layout>
                <DirectChat />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/support-network" element={
            <ProtectedRoute>
              <Layout>
                <SupportNetwork />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <Layout>
                <Help />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sleep-quality" element={
            <ProtectedRoute>
              <Layout>
                <SleepQuality />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/trial-ended" element={
            <ProtectedRoute>
              <TrialEnded />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </BrowserRouter>
        </SubscriptionProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
