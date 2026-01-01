"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ParsedTask } from "@/utils/taskParser";
import { supabaseDb } from "@/lib/supabase/index";
import { useSession } from "@/integrations/supabase/auth";
import Layout from "@/components/Layout";
import { format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { ReviewPageSkeleton } from "@/components/LoadingSkeletons";
import { Smile, Frown, Meh, Laugh, Angry } from "lucide-react";
import { cn } from "@/lib/utils";

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="text-center">
    <CardHeader className="pb-2">
      <CardTitle className="text-4xl font-bold">{value}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{title}</p>
    </CardContent>
  </Card>
);

const moodIcons = {
  radiante: { icon: Laugh, color: "text-green-500" },
  bem: { icon: Smile, color: "text-sky-500" },
  neutro: { icon: Meh, color: "text-yellow-500" },
  mal: { icon: Frown, color: "text-orange-500" },
  terrível: { icon: Angry, color: "text-red-500" },
};

const Review = () => {
  const { user, isLoading } = useSession();
  const userId = user?.id;

  const [reviewItems, setReviewItems] = useState<ParsedTask[]>([]);
  const [completedLastWeek, setCompletedLastWeek] = useState<ParsedTask[]>([]);
  const [moodsLastWeek, setMoodsLastWeek] = useState<{ mood: string; count: number }[]>([]);
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatCanBeImproved, setWhatCanBeImproved] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const weekStartDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    if (userId) {
      setPageLoading(true);
      const [review, completed, weeklyReviewData, moods] = await Promise.all([
        supabaseDb.getTasks(userId, 'review'),
        supabaseDb.getCompletedTasksLastWeek(userId),
        supabaseDb.getWeeklyReview(userId, weekStartDate),
        supabaseDb.getMoodLogsLastWeek(userId),
      ]);
      setReviewItems(review);
      setCompletedLastWeek(completed);
      setMoodsLastWeek(moods);
      if (weeklyReviewData) {
        setWhatWentWell(weeklyReviewData.what_went_well || "");
        setWhatCanBeImproved(weeklyReviewData.what_can_be_improved || "");
      }
      setPageLoading(false);
    }
  }, [userId, weekStartDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveReflection = async () => {
    if (!userId) return;
    setIsSaving(true);
    const success = await supabaseDb.upsertWeeklyReview(userId, {
      week_start_date: weekStartDate,
      what_went_well: whatWentWell,
      what_can_be_improved: whatCanBeImproved,
    });

    if (success) {
      toast.success("Reflexão salva com sucesso!");
    } else {
      toast.error("Falha ao salvar a reflexão.");
    }
    setIsSaving(false);
  };

  const tasksByProject = completedLastWeek.reduce((acc, task) => {
    const project = task.project || "Outros";
    if (!acc[project]) {
      acc[project] = 0;
    }
    acc[project]++;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading || pageLoading) {
    return <ReviewPageSkeleton />;
  }

  return (
    <Layout onTaskAddedToReview={loadData} onNoteAdded={loadData}>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Semana</CardTitle>
            <CardDescription>Suas conquistas e humores nos últimos 7 dias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Tarefas Concluídas" value={completedLastWeek.length} />
              <StatCard title="Projetos Ativos" value={Object.keys(tasksByProject).length} />
            </div>
            {moodsLastWeek.length > 0 && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold mb-2 text-center">Humores da Semana</h4>
                <div className="flex justify-center items-end gap-4">
                  {moodsLastWeek.map(({ mood, count }) => {
                    const { icon: Icon, color } = moodIcons[mood as keyof typeof moodIcons] || { icon: Meh, color: "text-gray-500" };
                    return (
                      <div key={mood} className="flex flex-col items-center gap-1">
                        <Icon className={cn("h-6 w-6", color)} />
                        <span className="text-xs font-bold">{count}x</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reflexão</CardTitle>
            <CardDescription>Tire um momento para pensar sobre sua semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Quais foram minhas vitórias esta semana?</h3>
              <Textarea
                placeholder="Liste suas vitórias, grandes ou pequenas..."
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">O que aprendi ou posso tentar de diferente?</h3>
              <Textarea
                placeholder="Identifique desafios e oportunidades de crescimento..."
                value={whatCanBeImproved}
                onChange={(e) => setWhatCanBeImproved(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveReflection} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Reflexão"}
            </Button>
          </CardContent>
        </Card>

        {reviewItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Itens Marcados para Revisão</CardTitle>
              <CardDescription>Itens que você salvou para analisar mais tarde.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {reviewItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary">
                    <span className="text-foreground">{item.title}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Review;