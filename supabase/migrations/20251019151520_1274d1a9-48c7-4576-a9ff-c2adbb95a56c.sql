-- Drop the existing public read policy
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;

-- Create a new policy that only allows authenticated users to view messages
CREATE POLICY "Authenticated users can view chat messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (true);