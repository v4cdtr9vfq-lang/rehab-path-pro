-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the daily cleanup job at 6 AM UTC
SELECT cron.schedule(
  'delete-old-chat-messages',
  '0 6 * * *', -- At 6:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://ntxhuytetumqlyvbwvka.supabase.co/functions/v1/delete-old-messages',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eGh1eXRldHVtcWx5dmJ3dmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Mjc1MTQsImV4cCI6MjA3NjEwMzUxNH0.Y1p8V0Znchzqjcigf-aFGwQmZl9Fth2O2LMbHuj2zPY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);