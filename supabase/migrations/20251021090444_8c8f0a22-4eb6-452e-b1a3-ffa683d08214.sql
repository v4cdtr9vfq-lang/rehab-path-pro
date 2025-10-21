-- Create mentorships table to track mentor-mentee relationships
CREATE TABLE public.mentorships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(mentee_id, mentor_id)
);

-- Enable RLS
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view mentorships they're part of"
  ON public.mentorships FOR SELECT
  USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "Users can create mentorship requests"
  ON public.mentorships FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update their mentorships"
  ON public.mentorships FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Create direct messages table for 1-on-1 chats
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for direct messages
CREATE POLICY "Users can view messages they sent or received"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages they send"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.direct_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;