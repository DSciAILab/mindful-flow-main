import { supabase, APP_ID } from "@/integrations/supabase/client";

export const getWeeklyReview = async (userId: string, weekStartDate: string): Promise<{ what_went_well: string; what_can_be_improved: string } | null> => {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('what_went_well, what_can_be_improved')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
    console.error("Error fetching weekly review:", error);
    return null;
  }
  return data;
};

export const upsertWeeklyReview = async (userId: string, review: { week_start_date: string; what_went_well: string; what_can_be_improved: string }): Promise<boolean> => {
  const { error } = await supabase
    .from('weekly_reviews')
    .upsert(
      {
        user_id: userId,
        app_id: APP_ID, // Adiciona o app_id
        week_start_date: review.week_start_date,
        what_went_well: review.what_went_well,
        what_can_be_improved: review.what_can_be_improved,
      },
      { onConflict: 'user_id, week_start_date' }
    );

  if (error) {
    console.error("Error upserting weekly review:", error);
    return false;
  }
  return true;
};