"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import FooterNav from "@/components/FooterNav";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useNavigation } from "@/contexts/NavigationContext";
import SidebarNav from "@/components/SidebarNav";

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const Chat = () => {
  const { isLoading: sessionLoading } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hooks de navegação para controlar a sidebar
  const { isSidebarVisible, isSidebarCollapsed } = useNavigation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { query: input },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = { sender: 'ai', text: data.response };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err: any) {
      console.error("Erro no chat:", err);
      const errorMessageText = err.message || "Desculpe, ocorreu um erro desconhecido.";
      const errorMessage: Message = { sender: 'ai', text: `Erro do Assistente: ${errorMessageText}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar visível apenas no desktop */}
      {isSidebarVisible && <SidebarNav isCollapsed={isSidebarCollapsed} />}

      {/* Conteúdo principal ajustado com margem quando a sidebar está presente */}
      <div className={cn(
        "flex flex-col flex-grow h-full transition-all duration-300",
        isSidebarVisible ? (isSidebarCollapsed ? "ml-16" : "ml-64") : ""
      )}>
        <header className="p-4 border-b border-border flex items-center flex-shrink-0">
          <Bot className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Dyad AI Chat</h1>
        </header>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
              <div className={cn("max-w-lg p-3 rounded-lg", msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sender === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Bot className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="max-w-lg p-3 rounded-lg bg-muted space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre suas tarefas, notas..."
            disabled={isLoading || sessionLoading}
          />
          <Button type="submit" disabled={isLoading || sessionLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Navegação inferior apenas para mobile */}
        {!isSidebarVisible && (
          <div className="flex-shrink-0 border-t">
            <FooterNav />
            <MadeWithDyad />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;