import { useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({ 
  children, 
  onDelete, 
  className,
  disabled = false 
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const deleteThreshold = -80; // pixels to trigger delete zone

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const diff = e.touches[0].clientX - startXRef.current;
    const newTranslate = currentXRef.current + diff;
    
    // Only allow swipe left (negative values), max -100px
    if (newTranslate <= 0 && newTranslate >= -100) {
      setTranslateX(newTranslate);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);
    
    // If swiped past threshold, keep showing delete button
    if (translateX < deleteThreshold) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setTranslateX(0);
    onDelete();
  };

  // Reset on any click outside when showing delete
  const handleCardClick = () => {
    if (translateX !== 0) {
      setTranslateX(0);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Delete action background */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 w-20 flex items-center justify-center",
          "bg-destructive text-destructive-foreground transition-opacity",
          translateX < deleteThreshold / 2 ? "opacity-100" : "opacity-0"
        )}
        onClick={handleDelete}
        onTouchEnd={handleDelete}
      >
        <Trash2 className="h-5 w-5" />
      </div>

      {/* Swipeable content */}
      <div
        className={cn(
          "relative bg-card transition-transform",
          isDragging ? "transition-none" : "duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        {children}
      </div>
    </div>
  );
}
