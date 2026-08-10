-- Add settings columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS default_seat_target integer DEFAULT 10;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS link_validity_days integer DEFAULT 30;
