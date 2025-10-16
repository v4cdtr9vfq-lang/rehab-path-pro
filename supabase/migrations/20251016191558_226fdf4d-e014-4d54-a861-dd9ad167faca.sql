-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the edge function to run daily at midnight (00:00)
-- This will delete messages older than 48 hours
SELECT cron.schedule(
  'delete-old-chat-messages',
  '0 0 * * *',  -- At 00:00 (midnight) every day
  $$
  SELECT
    net.http_post(
        url:='https://ntxhuytetumqlyvbwvka.supabase.co/functions/v1/delete-old-messages',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eGh1eXRldHVtcWx5dmJ3dmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Mjc1MTQsImV4cCI6MjA3NjEwMzUxNH0.Y1p8V0Znchzqjcigf-aFGwQmZl9Fth2O2LMbHuj2zPY"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
