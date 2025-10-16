-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own reports" ON public.message_reports;

-- Create a new policy that allows all authenticated users to see all reports
CREATE POLICY "All users can view reported messages"
ON public.message_reports
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Also add a DELETE policy so users can unreport messages
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.message_reports;

CREATE POLICY "Users can delete their own reports"
ON public.message_reports
FOR DELETE
USING (auth.uid() = reported_by);