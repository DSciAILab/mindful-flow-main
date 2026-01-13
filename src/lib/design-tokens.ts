import type { Priority, EnergyLevel, TaskContext } from "@/types";
import { 
  AlertCircle, 
  Flag, 
  Zap, 
  Leaf,
  Battery,
  BatteryMedium,
  BatteryFull,
  Home,
  Briefcase,
  Phone,
  Laptop,
  ShoppingCart,
  Globe
} from "lucide-react";

// ============================================
// PRIORITY CONFIGURATION
// ============================================
export const priorityConfig: Record<Priority, {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  icon: typeof AlertCircle;
}> = {
  urgent: {
    color: "text-priority-urgent",
    bgColor: "bg-priority-urgent/10",
    borderColor: "border-l-priority-urgent",
    label: "Urgente",
    icon: AlertCircle,
  },
  high: {
    color: "text-priority-high",
    bgColor: "bg-priority-high/10",
    borderColor: "border-l-priority-high",
    label: "Alta",
    icon: Flag,
  },
  medium: {
    color: "text-priority-medium",
    bgColor: "bg-priority-medium/10",
    borderColor: "border-l-priority-medium",
    label: "Média",
    icon: Zap,
  },
  low: {
    color: "text-priority-low",
    bgColor: "bg-priority-low/10",
    borderColor: "border-l-priority-low",
    label: "Baixa",
    icon: Leaf,
  },
};

// ============================================
// ENERGY LEVEL CONFIGURATION  
// ============================================
export const energyConfig: Record<EnergyLevel, {
  icon: typeof Battery;
  color: string;
  bgColor: string;
  label: string;
}> = {
  low: { 
    icon: Battery, 
    color: "text-amber-500", 
    bgColor: "bg-amber-500/10",
    label: "Baixa" 
  },
  medium: { 
    icon: BatteryMedium, 
    color: "text-blue-500", 
    bgColor: "bg-blue-500/10",
    label: "Média" 
  },
  high: { 
    icon: BatteryFull, 
    color: "text-emerald-500", 
    bgColor: "bg-emerald-500/10",
    label: "Alta" 
  },
};

// ============================================
// CONTEXT CONFIGURATION
// ============================================
export const contextConfig: Record<TaskContext, {
  icon: typeof Home;
  label: string;
}> = {
  "@home": { icon: Home, label: "Casa" },
  "@work": { icon: Briefcase, label: "Trabalho" },
  "@phone": { icon: Phone, label: "Telefone" },
  "@computer": { icon: Laptop, label: "Computador" },
  "@errands": { icon: ShoppingCart, label: "Recados" },
  "@anywhere": { icon: Globe, label: "Qualquer lugar" },
};

// ============================================
// CARD STYLE CONSTANTS
// ============================================
export const cardStyles = {
  base: "rounded-2xl border border-border/50 bg-card transition-all hover:border-border",
  interactive: "cursor-pointer hover:shadow-md",
  selected: "ring-2 ring-primary ring-offset-2 ring-offset-background",
  completed: "bg-muted/40 border-transparent",
  featured: "bg-gradient-to-br from-primary/5 via-card to-card",
} as const;

// Standard paddings for cards
export const cardPadding = {
  sm: "p-3",
  md: "p-4", 
  lg: "p-5",
  xl: "p-6",
} as const;
