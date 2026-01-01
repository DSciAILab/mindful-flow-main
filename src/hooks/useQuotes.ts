import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}

const DEFAULT_QUOTES: Omit<Quote, 'id' | 'createdAt'>[] = [
  { text: "A persistência realiza o impossível.", author: "Provérbio", category: "motivational", isActive: true },
  { text: "Feito é melhor que perfeito.", author: "Sheryl Sandberg", category: "motivational", isActive: true },
  { text: "Concentre-se no que importa agora.", author: "Desconhecido", category: "focus", isActive: true },
  { text: "Um passo de cada vez é suficiente.", author: "Desconhecido", category: "calm", isActive: true },
  { text: "Você não precisa ver toda a escada, apenas dê o primeiro passo.", author: "Martin Luther King Jr.", category: "motivational", isActive: true },
  { text: "O progresso, não a perfeição.", author: "Desconhecido", category: "focus", isActive: true },
  { text: "Respire. Você está exatamente onde precisa estar.", author: "Desconhecido", category: "calm", isActive: true },
  { text: "Pequenas vitórias levam a grandes conquistas.", author: "Desconhecido", category: "motivational", isActive: true },
];

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const loadQuotes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use default quotes for non-authenticated users
        const defaultQuotes = DEFAULT_QUOTES.map((q, i) => ({
          ...q,
          id: `default-${i}`,
          createdAt: new Date(),
        }));
        setQuotes(defaultQuotes);
        setCurrentQuote(defaultQuotes[0] || null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('mf_quotes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedQuotes: Quote[] = data.map((q: any) => ({
          id: q.id,
          text: q.text,
          author: q.author || 'Desconhecido',
          category: q.category || 'general',
          isActive: q.is_active,
          createdAt: new Date(q.created_at),
        }));
        setQuotes(mappedQuotes);
        setCurrentQuote(mappedQuotes[0] || null);
      } else {
        // Seed default quotes for new user
        await seedDefaultQuotes(user.id);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Fallback to default quotes
      const defaultQuotes = DEFAULT_QUOTES.map((q, i) => ({
        ...q,
        id: `default-${i}`,
        createdAt: new Date(),
      }));
      setQuotes(defaultQuotes);
      setCurrentQuote(defaultQuotes[0] || null);
    } finally {
      setLoading(false);
    }
  }, []);

  const seedDefaultQuotes = async (userId: string) => {
    try {
      const quotesToInsert = DEFAULT_QUOTES.map(q => ({
        user_id: userId,
        text: q.text,
        author: q.author,
        category: q.category,
        is_active: q.isActive,
      }));

      const { data, error } = await supabase
        .from('mf_quotes')
        .insert(quotesToInsert)
        .select();

      if (error) throw error;

      if (data) {
        const mappedQuotes: Quote[] = data.map((q: any) => ({
          id: q.id,
          text: q.text,
          author: q.author || 'Desconhecido',
          category: q.category || 'general',
          isActive: q.is_active,
          createdAt: new Date(q.created_at),
        }));
        setQuotes(mappedQuotes);
        setCurrentQuote(mappedQuotes[0] || null);
      }
    } catch (error) {
      console.error('Error seeding default quotes:', error);
    }
  };

  const addQuote = async (text: string, author: string, category: string = 'general') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('mf_quotes')
        .insert({
          user_id: user.id,
          text,
          author: author || 'Desconhecido',
          category,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newQuote: Quote = {
          id: data.id,
          text: data.text,
          author: data.author || 'Desconhecido',
          category: data.category || 'general',
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
        };
        setQuotes(prev => [newQuote, ...prev]);
        return newQuote;
      }
      return null;
    } catch (error) {
      console.error('Error adding quote:', error);
      return null;
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('mf_quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      setQuotes(prev => prev.filter(q => q.id !== quoteId));
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  };

  const nextQuote = useCallback(() => {
    if (quotes.length === 0) return;
    const nextIndex = (quoteIndex + 1) % quotes.length;
    setQuoteIndex(nextIndex);
    setCurrentQuote(quotes[nextIndex]);
  }, [quotes, quoteIndex]);

  const importFromCSV = async (csvContent: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, count: 0 };

      const lines = csvContent.split(/\r?\n/).filter(l => l.trim());
      const quotesToInsert: any[] = [];

      for (const line of lines) {
        const idx = line.indexOf(',');
        if (idx <= 0) continue;
        const text = line.slice(0, idx).trim().replace(/^"|"$/g, '');
        const author = line.slice(idx + 1).trim().replace(/^"|"$/g, '') || 'Desconhecido';
        if (text) {
          quotesToInsert.push({
            user_id: user.id,
            text,
            author,
            category: 'imported',
            is_active: true,
          });
        }
      }

      if (quotesToInsert.length === 0) return { success: false, count: 0 };

      const { data, error } = await supabase
        .from('mf_quotes')
        .insert(quotesToInsert)
        .select();

      if (error) throw error;

      if (data) {
        const mappedQuotes: Quote[] = data.map((q: any) => ({
          id: q.id,
          text: q.text,
          author: q.author || 'Desconhecido',
          category: q.category || 'general',
          isActive: q.is_active,
          createdAt: new Date(q.created_at),
        }));
        setQuotes(prev => [...mappedQuotes, ...prev]);
      }

      return { success: true, count: quotesToInsert.length };
    } catch (error) {
      console.error('Error importing quotes:', error);
      return { success: false, count: 0 };
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  return {
    quotes,
    currentQuote,
    loading,
    nextQuote,
    addQuote,
    deleteQuote,
    importFromCSV,
    reload: loadQuotes,
  };
}
