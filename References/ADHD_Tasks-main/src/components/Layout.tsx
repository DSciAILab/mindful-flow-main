"use client";

import React, { useEffect } from "react";
import FooterNav from "./FooterNav";
import { MadeWithDyad } from "./made-with-dyad";
import QuickCaptureBar from "./QuickCaptureBar";
import { useQuickCapture } from "@/hooks/useQuickCapture";
import { useSession } from "@/integrations/supabase/auth";
import GlobalTimerIndicator from "./GlobalTimerIndicator";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import SidebarNav from "./SidebarNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigation } from "@/contexts/NavigationContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  onHabitAdded?: () => void;
  onTaskAddedToProject?: () => void;
  onTaskAddedToInbox?: () => void;
  onTaskAddedToReview?: () => void;
  onNoteAdded?: () => void;
}

const Layout = ({
  children,
  headerActions,
  onHabitAdded,
  onTaskAddedToProject,
  onTaskAddedToInbox,
  onTaskAddedToReview,
  onNoteAdded,
}: LayoutProps) => {
  const { user } = useSession();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isSidebarVisible, isSidebarCollapsed, isFooterNavVisible } = useNavigation();

  const { handleQuickCapture } = useQuickCapture(userId, location.pathname, {
    onHabitAdded,
    onTaskAddedToProject,
    onTaskAddedToInbox,
    onTaskAddedToReview,
    onNoteAdded,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      if (isModifierPressed && !isInputFocused) {
        switch (event.key) {
          case '1': event.preventDefault(); navigate('/'); break; // Hoje
          case '2': event.preventDefault(); navigate('/inbox'); break;
          case '3': event.preventDefault(); navigate('/habits'); break;
          case '4': event.preventDefault(); navigate('/notes'); break; // Notas
          case '5': event.preventDefault(); navigate('/chat'); break; // Chat
          case '6': event.preventDefault(); navigate('/review'); break;
          case '7': event.preventDefault(); navigate('/profile'); break;
          case '8': event.preventDefault(); navigate('/dashboard-legacy'); break; // Dashboard (Legacy)
          default: break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Ajusta o padding do conteúdo principal com base na visibilidade e estado da sidebar
  const mainContentPaddingLeft = isSidebarVisible ? (isSidebarCollapsed ? 'pl-16' : 'pl-64') : 'pl-0';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop Sidebar */}
      {isSidebarVisible && <SidebarNav isCollapsed={isSidebarCollapsed} />}

      <div className={cn("flex flex-col flex-grow", mainContentPaddingLeft)}>
        <Header actions={headerActions} />
        <main className="flex-grow overflow-y-auto pb-48"> {/* Aumentado o padding-bottom para acomodar o footer fixo */}
          {children}
        </main>
      </div>

      <GlobalTimerIndicator
        isFocusMode={false}
        currentPath={location.pathname}
      />
      
      {/* Mobile Footer Nav & Quick Capture */}
      {isMobile && isFooterNavVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
          <QuickCaptureBar onCapture={handleQuickCapture} />
          <FooterNav />
          <MadeWithDyad />
        </div>
      )}
    </div>
  );
};

export default Layout;