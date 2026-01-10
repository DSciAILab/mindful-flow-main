import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Lightbulb, X, Send } from 'lucide-react';

interface QuickDistractionCaptureProps {
  isVisible: boolean;
  currentTaskId?: string;
  focusSessionId?: string;
  onCapture: (content: string) => void;
}

export function QuickDistractionCapture({
  isVisible,
  currentTaskId,
  focusSessionId,
  onCapture,
}: QuickDistractionCaptureProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setContent('');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  const handleSubmit = () => {
    if (content.trim()) {
      onCapture(content.trim());
      setContent('');
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[101] animate-fade-in">
      {isExpanded ? (
        <div className="flex items-center gap-2 p-3 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl animate-scale-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          
          <Input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="O que veio à mente?"
            className="w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              "h-9 w-9 rounded-xl transition-colors",
              content.trim() 
                ? "text-amber-500 hover:bg-amber-500/20" 
                : "text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsExpanded(false);
              setContent('');
            }}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          size="icon"
          onClick={() => setIsExpanded(true)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            "bg-amber-500/90 hover:bg-amber-500 hover:scale-110",
            "text-white"
          )}
          title="Anotar pensamento (Parking Lot)"
        >
          <Lightbulb className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
