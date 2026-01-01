"use client";

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Inbox, ListTodo, History, User, StickyNote, Bot, ListChecks, PlayCircle, Brain } from "lucide-react";
import { MadeWithDyad } from "./made-with-dyad";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SidebarNavProps {
  isCollapsed: boolean;
}

const SidebarNav = ({ isCollapsed }: SidebarNavProps) => {
  const location = useLocation();
  const currentDateTime = new Date();
  
  const formattedDate = format(currentDateTime, "EEEE, d 'de' MMMM", { locale: ptBR });
  const formattedTime = format(currentDateTime, "HH:mm");

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
    { name: "Dashboard (Legacy)", icon: Calendar, path: "/dashboard-legacy" },
  ];

  return (
    <div className={cn("fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-background transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <ListChecks className="h-6 w-6" />
          {!isCollapsed && <span>Meu App</span>}
        </Link>
      </div>
      {!isCollapsed && (
        <div className="p-4 border-b">
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          <h2 className="text-xl font-bold">{formattedTime}</h2>
        </div>
      )}
      <nav className="flex-grow p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full", isCollapsed ? "justify-center" : "justify-start")}
                  asChild
                >
                  <Link to={item.path}>
                    <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && item.name}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto p-4">
        {!isCollapsed && <MadeWithDyad />}
      </div>
    </div>
  );
};

export default SidebarNav;