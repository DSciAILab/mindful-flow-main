import { 
  Heart, 
  Briefcase, 
  Wallet, 
  Users, 
  Home, 
  PartyPopper, 
  Sprout, 
  Gamepad2 
} from "lucide-react";

export interface LifeArea {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

export const LIFE_AREAS: LifeArea[] = [
  { id: 'health', name: 'Saúde', icon: Heart, color: 'hsl(160, 60%, 45%)' },
  { id: 'career', name: 'Carreira', icon: Briefcase, color: 'hsl(32, 85%, 55%)' },
  { id: 'finances', name: 'Finanças', icon: Wallet, color: 'hsl(45, 90%, 55%)' },
  { id: 'relationships', name: 'Relacionamentos', icon: Users, color: 'hsl(0, 72%, 55%)' },
  { id: 'family', name: 'Família', icon: Home, color: 'hsl(280, 60%, 55%)' },
  { id: 'social', name: 'Social', icon: PartyPopper, color: 'hsl(200, 70%, 50%)' },
  { id: 'personal', name: 'Crescimento', icon: Sprout, color: 'hsl(120, 50%, 45%)' },
  { id: 'fun', name: 'Diversão', icon: Gamepad2, color: 'hsl(320, 70%, 55%)' },
];

export const getLifeAreaById = (id: string | undefined): LifeArea | undefined => {
  if (!id) return undefined;
  return LIFE_AREAS.find(area => area.id === id);
};
