import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLegacy from "./pages/DashboardLegacy"; 
import Inbox from "./pages/Inbox";
import Habits from "./pages/Habits";
import Review from "./pages/Review";
import Profile from "./pages/Profile";
import Quotes from "./pages/Quotes";
import Notes from "./pages/Notes";
import Thoughts from "./pages/Thoughts"; // New Import
import Chat from "./pages/Chat";
import Focus from "./pages/Focus";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import TodayView from "./pages/TodayView";
import { SessionContextProvider } from "./integrations/supabase/auth";
import { ThemeProvider } from "./components/ThemeProvider";
import { TimerProvider } from "@/contexts/TimerContext";
import { NavigationProvider } from "@/contexts/NavigationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <TimerProvider>
              <NavigationProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<TodayView />} />
                  <Route path="/dashboard-legacy" element={<DashboardLegacy />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/focus" element={<Focus />} />
                  <Route path="/habits" element={<Habits />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/thoughts" element={<Thoughts />} /> {/* New Route */}
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/review" element={<Review />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NavigationProvider>
            </TimerProvider>
          </SessionContextProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;