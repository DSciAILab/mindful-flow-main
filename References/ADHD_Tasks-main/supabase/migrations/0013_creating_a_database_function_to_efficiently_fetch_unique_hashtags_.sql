CREATE OR REPLACE FUNCTION public.get_unique_hashtags_for_user(p_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
AS $$
  SELECT array_agg(DISTINCT hashtag)
  FROM (
    SELECT unnest(hashtags) AS hashtag
    FROM public.tasks
    WHERE user_id = p_user_id AND hashtags IS NOT NULL
    UNION ALL
    SELECT unnest(hashtags) AS hashtag
    FROM public.notes
    WHERE user_id = p_user_id AND hashtags IS NOT NULL
  ) AS all_hashtags;
$$;