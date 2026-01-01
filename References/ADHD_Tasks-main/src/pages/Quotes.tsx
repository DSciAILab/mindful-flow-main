"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from "@/integrations/supabase/auth";
import { supabaseDb } from "@/lib/supabase/index";
import Layout from "@/components/Layout";
import { Plus, Upload, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Papa, { ParseResult } from "papaparse";

interface Quote {
  id: string;
  text: string;
  author: string | null;
}

const Quotes = () => {
  const { user, isLoading } = useSession();
  const userId = user?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [duration, setDuration] = useState(30);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");

  const loadData = useCallback(async () => {
    if (userId) {
      const [userQuotes, profile] = await Promise.all([
        supabaseDb.getQuotes(userId),
        supabaseDb.getProfile(userId),
      ]);
      setQuotes(userQuotes);
      setDuration(profile?.quote_duration_seconds || 30);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveDuration = async () => {
    if (!userId) return;
    const success = await supabaseDb.updateProfile(userId, { quote_duration_seconds: Number(duration) });
    if (success) {
      toast.success("Tempo de exibição salvo com sucesso!");
    } else {
      toast.error("Falha ao salvar o tempo de exibição.");
    }
  };

  const handleOpenDialog = (quote: Quote | null = null) => {
    setEditingQuote(quote);
    setQuoteText(quote?.text || "");
    setQuoteAuthor(quote?.author || "");
    setIsDialogOpen(true);
  };

  const handleSaveQuote = async () => {
    if (!userId || !quoteText.trim()) {
      toast.error("O texto da citação não pode estar vazio.");
      return;
    }

    const quoteData = { text: quoteText.trim(), author: quoteAuthor.trim() || null };
    let success = false;

    if (editingQuote) {
      success = await supabaseDb.updateQuote(userId, editingQuote.id, quoteData);
    } else {
      success = await supabaseDb.addQuote(userId, quoteData);
    }

    if (success) {
      toast.success(`Citação ${editingQuote ? 'atualizada' : 'adicionada'} com sucesso!`);
      setIsDialogOpen(false);
      loadData();
    } else {
      toast.error(`Falha ao ${editingQuote ? 'atualizar' : 'adicionar'} a citação.`);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!userId) return;
    const success = await supabaseDb.deleteQuote(userId, quoteId);
    if (success) {
      toast.success("Citação deletada com sucesso!");
      loadData();
    } else {
      toast.error("Falha ao deletar a citação.");
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results: ParseResult<string[]>) => {
        const newQuotes = results.data.map((row) => ({
          text: row[0]?.trim(),
          author: row[1]?.trim() || null,
        })).filter((q): q is { text: string; author: string | null } => !!q.text);

        if (newQuotes.length > 0) {
          const success = await supabaseDb.addMultipleQuotes(userId, newQuotes);
          if (success) {
            toast.success(`${newQuotes.length} citações importadas com sucesso!`);
            loadData();
          } else {
            toast.error("Falha ao importar as citações.");
          }
        } else {
          toast.warning("Nenhuma citação válida encontrada no arquivo.");
        }
      },
      error: (error: Error) => {
        toast.error(`Erro ao processar o arquivo: ${error.message}`);
      },
    });
    event.target.value = '';
  };

  if (isLoading) {
    return <Layout><div>Carregando...</div></Layout>;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".csv"
        className="hidden"
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Importar CSV
      </Button>
      <Button onClick={() => handleOpenDialog()}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Citação
      </Button>
    </div>
  );

  return (
    <Layout headerActions={headerActions} onNoteAdded={() => {}}>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Ajuste como as citações são exibidas no aplicativo.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Label htmlFor="duration">Tempo de Exibição (segundos)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-24"
            />
            <Button onClick={handleSaveDuration}>Salvar</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sua Coleção</CardTitle>
            <CardDescription>Gerencie suas citações salvas.</CardDescription>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhuma citação adicionada ainda.</p>
            ) : (
              <ul className="space-y-3">
                {quotes.map((quote) => (
                  <li key={quote.id} className="p-3 border rounded-md flex justify-between items-start gap-4">
                    <div className="flex-grow">
                      <p className="italic">"{quote.text}"</p>
                      {quote.author && <p className="text-sm font-semibold mt-1">- {quote.author}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(quote)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteQuote(quote.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-[425px]"> {/* Ajustado para ser full width em telas pequenas */}
          <DialogHeader>
            <DialogTitle>{editingQuote ? "Editar Citação" : "Adicionar Nova Citação"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quote-text">Citação</Label>
              <Textarea id="quote-text" value={quoteText} onChange={(e) => setQuoteText(e.target.value)} placeholder="O texto da citação..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-author">Autor</Label>
              <Input id="quote-author" value={quoteAuthor} onChange={(e) => setQuoteAuthor(e.target.value)} placeholder="Autor (opcional)" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveQuote}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Quotes;