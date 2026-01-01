import { useState, useEffect } from 'react';
import { useQuotes } from '@/hooks/useQuotes';
import { cn } from '@/lib/utils';
import { Quote, RefreshCw } from 'lucide-react';

interface QuoteDisplayProps {
  className?: string;
  intervalSeconds?: number;
  showRefreshButton?: boolean;
  compact?: boolean;
}

export function QuoteDisplay({ 
  className, 
  intervalSeconds = 30,
  showRefreshButton = false,
  compact = false 
}: QuoteDisplayProps) {
  const { currentQuote, nextQuote, loading } = useQuotes();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (intervalSeconds <= 0) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        nextQuote();
        setIsAnimating(false);
      }, 300);
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [intervalSeconds, nextQuote]);

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => {
      nextQuote();
      setIsAnimating(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!currentQuote) {
    return null;
  }

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground transition-opacity duration-300",
          isAnimating && "opacity-0",
          className
        )}
      >
        <Quote className="h-3 w-3 flex-shrink-0" />
        <span className="italic line-clamp-1">{currentQuote.text}</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-center transition-all duration-300",
        isAnimating && "opacity-0 scale-95",
        className
      )}
    >
      <Quote className="mx-auto mb-2 h-5 w-5 text-primary/60" />
      
      <blockquote className="text-sm font-medium leading-relaxed text-foreground md:text-base">
        "{currentQuote.text}"
      </blockquote>
      
      <cite className="mt-2 block text-xs text-muted-foreground not-italic">
        — {currentQuote.author}
      </cite>

      {showRefreshButton && (
        <button
          onClick={handleRefresh}
          className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary"
          title="Próxima citação"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
