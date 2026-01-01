"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import MobileNavSheet from "./MobileNavSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigation } from "@/contexts/NavigationContext";
// import { format } from "date-fns"; // Removido: 'format' não é usado aqui
// import { ptBR } from "date-fns/locale"; // Removido: 'ptBR' não é usado aqui

interface HeaderProps {
  actions?: React.ReactNode;
}

const Header = ({ actions }: HeaderProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { setNavMode, isSidebarCollapsed } = useNavigation(); // Removido: 'navMode' e 'isSidebarVisible' não são usados aqui

  // A data e hora agora são exibidas na Sidebar no desktop, então removemos do Header para desktop.
  // Mantemos para mobile.
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = () => {
    if (isMobile) {
      setIsSheetOpen(true);
    } else {
      // No desktop, o botão de menu alterna o estado da sidebar
      setNavMode(isSidebarCollapsed ? 'sidebar-expanded' : 'sidebar-collapsed');
    }
  };

  const formattedDate = currentDateTime.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = currentDateTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          {isMobile && ( // Exibir data e hora apenas no mobile
            <div>
              <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
              <h2 className="text-2xl font-bold">{formattedTime}</h2>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
      <MobileNavSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
};

export default Header;