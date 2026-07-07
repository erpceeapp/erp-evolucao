-- Add local column to eventos table
-- The column was already referenced in queries and types but never created

ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS local text;
