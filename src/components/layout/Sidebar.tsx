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
  Flame
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 5 },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'habits', label: 'Hábitos', icon: Flame },
  { id: 'projects', label: 'Projetos', icon: FolderKanban },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'journal', label: 'Diário', icon: BookOpen },
  { id: 'reflection', label: 'Reflexões', icon: Brain },
  { id: 'ideas', label: 'Ideias', icon: Lightbulb },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export function Sidebar({ isOpen, onClose, activeView, onViewChange }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border/50 bg-sidebar transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
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
