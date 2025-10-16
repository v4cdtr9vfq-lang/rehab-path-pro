-- Create table for message reports
CREATE TABLE public.message_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can report messages
CREATE POLICY "Authenticated users can report messages"
ON public.message_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.message_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reported_by);

-- Add index for better performance
CREATE INDEX idx_message_reports_message_id ON public.message_reports(message_id);
CREATE INDEX idx_message_reports_reported_by ON public.message_reports(reported_by);