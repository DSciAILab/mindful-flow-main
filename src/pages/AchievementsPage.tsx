import { GamificationDashboard } from '@/components/gamification';

interface AchievementsPageProps {
  stats: any;
  completedTasks: any[];
}

export function AchievementsPage({ stats, completedTasks }: AchievementsPageProps) {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <GamificationDashboard 
          stats={{
            tasksCompleted: stats.tasksCompletedToday + (completedTasks?.length || 0),
            focusMinutesTotal: stats.focusMinutesToday,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            habitsCompletedStreak: 0, // TODO: Get from habits hook
            hasPanicModeSurvived: false,
            hasEarlyBirdTask: false,
            hasNightOwlTask: false,
          }}
        />
      </div>
    </div>
  );
}
