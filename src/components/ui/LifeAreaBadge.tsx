import { getLifeAreaById } from "@/lib/lifeAreas";
import { cn } from "@/lib/utils";

interface LifeAreaBadgeProps {
  areaId?: string;
  className?: string;
  showName?: boolean;
}

export function LifeAreaBadge({ areaId, className, showName = true }: LifeAreaBadgeProps) {
  const area = getLifeAreaById(areaId);
  
  if (!area) return null;
  
  const Icon = area.icon;
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-muted/50 border border-border/30",
        className
      )}
      style={{ 
        color: area.color,
        borderColor: area.color + '40'
      }}
    >
      <Icon className="h-3 w-3" style={{ color: area.color }} />
      {showName && area.name}
    </span>
  );
}
