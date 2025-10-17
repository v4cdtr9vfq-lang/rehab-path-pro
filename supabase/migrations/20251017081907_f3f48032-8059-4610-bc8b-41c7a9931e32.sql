-- Create support_contacts table
CREATE TABLE public.support_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own contacts"
  ON public.support_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON public.support_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.support_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.support_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_support_contacts_updated_at
  BEFORE UPDATE ON public.support_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();