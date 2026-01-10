import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FolderKanban,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Target,
  Brain,
  Lightbulb,
  X,
  Flame,
  Timer,
  FileText,
  PenTool,
  ChevronRight,
  Trophy
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  mode?: 'fixed' | 'auto-hide';
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 5 },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'habits', label: 'Hábitos', icon: Flame },
  { id: 'projects', label: 'Projetos', icon: FolderKanban },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'notes', label: 'Notas', icon: FileText },
  { id: 'canvas', label: 'Canvas', icon: PenTool },
  { id: 'journal', label: 'Diário', icon: BookOpen },
  { id: 'reflection', label: 'Reflexões', icon: Brain },
  { id: 'ideas', label: 'Ideias', icon: Lightbulb },
  { id: 'achievements', label: 'Conquistas', icon: Trophy },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export function Sidebar({ isOpen, onClose, activeView, onViewChange, mode = 'fixed' }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if sidebar should be visible
  const isAutoHide = mode === 'auto-hide';
  const shouldShow = isAutoHide 
    ? (isOpen || isHovered) 
    : true; // Fixed mode always shows on desktop
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Auto-hide trigger zone - only visible when auto-hide is enabled and sidebar is hidden */}
      {isAutoHide && !isOpen && !isHovered && (
        <div 
          className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-4 md:block"
          onMouseEnter={() => setIsHovered(true)}
        >
          <div className="flex h-full items-center justify-center">
            <div className="flex h-16 w-2 items-center justify-center rounded-r-full bg-primary/20 opacity-0 transition-opacity hover:opacity-100">
              <ChevronRight className="h-3 w-3 text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border/50 bg-sidebar transition-transform duration-300 ease-in-out",
          // Desktop behavior based on mode
          isAutoHide 
            ? (shouldShow ? "md:translate-x-0" : "md:-translate-x-full")
            : "md:translate-x-0",
          // Mobile behavior (always controlled by isOpen)
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => isAutoHide && setIsHovered(true)}
        onMouseLeave={() => isAutoHide && setIsHovered(false)}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-end p-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-soft" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                      isActive 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="border-t border-sidebar-border p-3">
            <button
              onClick={() => onViewChange('settings')}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                activeView === 'settings'
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
