import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsAnimationProps {
  points: number;
  position?: { x: number; y: number };
  onComplete: () => void;
}

export function PointsAnimation({
  points,
  position,
  onComplete,
}: PointsAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  // Color based on points amount
  const getColor = () => {
    if (points >= 100) return '#FFD700'; // Gold
    if (points >= 50) return '#F59E0B'; // Amber
    if (points >= 25) return '#EAB308'; // Yellow
    return '#22C55E'; // Green
  };

  const color = getColor();

  return (
    <div
      className={cn(
        "fixed z-[100] pointer-events-none animate-points-float",
        "flex items-center gap-1 px-3 py-1.5 rounded-full",
        "font-bold text-sm shadow-lg"
      )}
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: `${color}20`,
        border: `2px solid ${color}`,
        color: color,
      }}
    >
      <Star className="h-4 w-4" style={{ color }} />
      <span>+{points}</span>
    </div>
  );
}

// Container to manage multiple point animations
interface PointsAnimationContainerProps {
  animations: Array<{
    id: string;
    points: number;
    position?: { x: number; y: number };
  }>;
  onAnimationComplete: (id: string) => void;
}

export function PointsAnimationContainer({
  animations,
  onAnimationComplete,
}: PointsAnimationContainerProps) {
  return (
    <>
      {animations.map(anim => (
        <PointsAnimation
          key={anim.id}
          points={anim.points}
          position={anim.position}
          onComplete={() => onAnimationComplete(anim.id)}
        />
      ))}
    </>
  );
}
