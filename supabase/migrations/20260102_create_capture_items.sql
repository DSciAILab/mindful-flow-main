-- =====================================================
-- MINDFUL FLOW - Capture Items (Brain Dump/Inbox)
-- Migration: Create mf_capture_items table with soft delete
-- =====================================================

-- 1. Create the capture items table
CREATE TABLE IF NOT EXISTS public.mf_capture_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'audio', 'photo', 'video', 'canvas')),
  content TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.mf_capture_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can view own capture items" 
  ON public.mf_capture_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own capture items" 
  ON public.mf_capture_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own capture items" 
  ON public.mf_capture_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own capture items" 
  ON public.mf_capture_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mf_capture_items_user_id 
  ON public.mf_capture_items(user_id);

-- Index for active (non-deleted) items
CREATE INDEX IF NOT EXISTS idx_mf_capture_items_active 
  ON public.mf_capture_items(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for processed status
CREATE INDEX IF NOT EXISTS idx_mf_capture_items_processed 
  ON public.mf_capture_items(user_id, processed) 
  WHERE deleted_at IS NULL;

-- 5. Add trigger for updated_at
CREATE TRIGGER update_mf_capture_items_updated_at
  BEFORE UPDATE ON public.mf_capture_items
  FOR EACH ROW 
  EXECUTE FUNCTION public.mf_update_updated_at_column();

-- 6. Add comments for documentation
COMMENT ON TABLE public.mf_capture_items IS 'Brain dump/inbox items for quick capture';
COMMENT ON COLUMN public.mf_capture_items.type IS 'Type of capture: text, audio, photo, video, canvas';
COMMENT ON COLUMN public.mf_capture_items.content IS 'The captured content or text';
COMMENT ON COLUMN public.mf_capture_items.processed IS 'Whether the item has been processed into a task/note/project';
COMMENT ON COLUMN public.mf_capture_items.deleted_at IS 'Soft delete timestamp - item is hidden but preserved';
