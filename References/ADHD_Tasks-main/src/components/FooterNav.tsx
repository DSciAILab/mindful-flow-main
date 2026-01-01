"use client";

import { Button } from "@/components/ui/button";
import { Inbox, ListTodo, History, User, StickyNote, Bot, ListChecks, PlayCircle, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";
import { useIsMobile } from "@/hooks/use-mobile";

const FooterNav = () => {
  const location = useLocation();
  const { isFooterNavVisible } = useNavigation();
  const isMobile = useIsMobile();

  const navItems = [
    { name: "Hoje", icon: ListChecks, path: "/" },
    { name: "Focus", icon: PlayCircle, path: "/focus" },
    { name: "Inbox", icon: Inbox, path: "/inbox" },
    { name: "Hábitos", icon: ListTodo, path: "/habits" },
    { name: "Notas", icon: StickyNote, path: "/notes" },
    { name: "Pensamentos", icon: Brain, path: "/thoughts" }, // New Item
    { name: "Chat", icon: Bot, path: "/chat" },
    { name: "Revisão", icon: History, path: "/review" },
    { name: "Perfil", icon: User, path: "/profile" },
  ];

  if (!isFooterNavVisible && !isMobile) {
    return null;
  }

  return (
    <div className="bg-background border-t border-border flex justify-around items-end p-2 overflow-x-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Button
            key={item.name}
            variant={isActive ? "secondary" : "ghost"} 
            className={cn(
              "flex flex-col items-center justify-center h-auto p-1 text-xs flex-shrink-0 transition-transform duration-200",
              isActive && "transform scale-110 -translate-y-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-16 w-16 shadow-lg"
            )}
            asChild
          >
            <Link to={item.path}>
              <item.icon className="h-5 w-5 mb-1" />
              {item.name}
            </Link>
          </Button>
        );
      })}
    </div>
  );
};

export default FooterNav;