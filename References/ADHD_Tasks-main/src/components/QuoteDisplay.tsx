"use client";

import { useState, useEffect } from "react";
import { supabaseDb } from "@/lib/supabase/index";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface Quote {
  id: string;
  text: string;
  author: string | null;
}

interface QuoteDisplayProps {
  durationInSeconds: number;
}

const QuoteDisplay = ({ durationInSeconds }: QuoteDisplayProps) => {
  const { user } = useSession();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (user?.id) {
        setIsLoading(true);
        const userQuotes = await supabaseDb.getQuotes(user.id);
        setQuotes(userQuotes);
        if (userQuotes.length > 0) {
          setCurrentQuote(userQuotes[Math.floor(Math.random() * userQuotes.length)]);
        }
        setIsLoading(false);
      }
    };
    fetchQuotes();
  }, [user?.id]);

  useEffect(() => {
    if (quotes.length > 1 && durationInSeconds > 0) {
      const interval = setInterval(() => {
        let nextQuote;
        do {
          nextQuote = quotes[Math.floor(Math.random() * quotes.length)];
        } while (nextQuote.id === currentQuote?.id);
        setCurrentQuote(nextQuote);
      }, durationInSeconds * 1000);

      return () => clearInterval(interval);
    }
  }, [quotes, currentQuote, durationInSeconds]);

  if (isLoading) {
    return (
      <div className="p-4 text-center italic">
        <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/4 mx-auto" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return null;
  }

  return (
    <div className="p-4 text-center italic text-muted-foreground">
      <p>"{currentQuote?.text}"</p>
      {currentQuote?.author && <p className="mt-2 text-sm font-semibold not-italic">- {currentQuote.author}</p>}
    </div>
  );
};

export default QuoteDisplay;