"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Inbox, ListTodo, History, User, StickyNote, Bot, ListChecks, PlayCircle, Brain } from "lucide-react";
import { MadeWithDyad } from "./made-with-dyad";

interface MobileNavSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const MobileNavSheet = ({ isOpen, onOpenChange }: MobileNavSheetProps) => {
  const location = useLocation();

  const navItems = [
    { name: "Hoje", icon: Calendar, path: "/" },
    { name: "Focus", icon: PlayCircle, path: "/focus" },
    { name: "Inbox", icon: Inbox, path: "/inbox" },
    { name: "Hábitos", icon: ListTodo, path: "/habits" },
    { name: "Notas", icon: StickyNote, path: "/notes" },
    { name: "Pensamentos", icon: Brain, path: "/thoughts" }, // New Item
    { name: "Chat", icon: Bot, path: "/chat" },
    { name: "Revisão", icon: History, path: "/review" },
    { name: "Perfil", icon: User, path: "/profile" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle asChild>
            <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => onOpenChange(false)}>
              <ListChecks className="h-6 w-6" />
              <span>Meu App</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-grow p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <SheetClose asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={item.path}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </Button>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4">
          <MadeWithDyad />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavSheet;