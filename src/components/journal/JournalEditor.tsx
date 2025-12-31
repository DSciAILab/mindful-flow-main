import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Save, 
  Smile, 
  Meh, 
  Frown, 
  Heart,
  ThumbsUp,
  Tag,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types";

interface JournalEditorProps {
  entry?: JournalEntry | null;
  onSave: (entry: Partial<JournalEntry>) => void;
  onCancel: () => void;
}

const moodOptions = [
  { value: 5, icon: Heart, label: 'Ótimo', color: 'text-green-500 hover:bg-green-500/10' },
  { value: 4, icon: ThumbsUp, label: 'Bem', color: 'text-blue-500 hover:bg-blue-500/10' },
  { value: 3, icon: Smile, label: 'Ok', color: 'text-yellow-500 hover:bg-yellow-500/10' },
  { value: 2, icon: Meh, label: 'Meh', color: 'text-orange-500 hover:bg-orange-500/10' },
  { value: 1, icon: Frown, label: 'Difícil', color: 'text-red-500 hover:bg-red-500/10' },
];

export function JournalEditor({ entry, onSave, onCancel }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [mood, setMood] = useState<number | undefined>(entry?.mood);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || "");
      setContent(entry.content || "");
      setMood(entry.mood);
      setTags(entry.tags || []);
    }
  }, [entry]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!content.trim()) return;
    
    // Auto-generate title from first line if not provided
    const autoTitle = title.trim() || content.split('\n')[0].slice(0, 50);
    
    onSave({
      id: entry?.id,
      title: autoTitle,
      content: content.trim(),
      mood: mood as JournalEntry['mood'],
      tags,
    });
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">
          {entry ? 'Editar Entrada' : 'Nova Entrada'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Title */}
      <div className="mb-4">
        <Input
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-none bg-muted/50 text-lg font-medium placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seus pensamentos aqui..."
          className="min-h-[200px] w-full resize-none rounded-xl border border-border/50 bg-muted/30 p-4 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
        </p>
      </div>

      {/* Mood selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Como você está se sentindo?</p>
        <div className="flex gap-2">
          {moodOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setMood(mood === option.value ? undefined : option.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl p-3 transition-all duration-200",
                  mood === option.value
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <Icon className={cn("h-6 w-6", option.color.split(' ')[0])} />
                <span className="text-xs text-muted-foreground">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Tags</p>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Adicionar tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 w-32 border-none bg-transparent text-sm placeholder:text-muted-foreground/50"
            />
            {newTag && (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!content.trim()}>
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
