import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Star, 
  Trophy,
  Menu,
  Bell,
  Sparkles,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { UserStats } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  stats: UserStats;
  onMenuToggle: () => void;
  onPanicMode: () => void;
}

export function Header({ stats, onMenuToggle, onPanicMode }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitial = user?.user_metadata?.display_name?.charAt(0)?.toUpperCase() 
    || user?.email?.charAt(0)?.toUpperCase() 
    || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-soft">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-display text-xl font-semibold text-foreground md:block">
              LifeFlow
            </span>
          </div>
        </div>

        {/* Center - Stats */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
            <Flame className="h-4 w-4 text-priority-high" />
            <span className="text-sm font-semibold">{stats.currentStreak}</span>
          </div>

          {/* Points */}
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
            <Star className="h-4 w-4 text-reward-gold" />
            <span className="text-sm font-semibold">{stats.totalPoints}</span>
          </div>

          {/* Level */}
          <div className="hidden items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 sm:flex">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Nível {stats.level}</span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-priority-urgent" />
          </Button>

          <Button 
            variant="panic" 
            size="sm"
            onClick={onPanicMode}
            className="hidden sm:flex"
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Modo Pânico
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-muted-foreground text-xs">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
