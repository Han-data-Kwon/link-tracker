-- ──────────────────────────────────────────────
-- pg_cron: 10분마다 check-alerts Edge Function 자동 실행
-- pg_cron 확장이 활성화되어 있어야 합니다.
-- Supabase Dashboard > Database > Extensions > pg_cron 활성화 필요
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 동일 이름 스케줄이 있으면 제거 후 재등록
SELECT cron.unschedule('check-alerts-every-10min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-alerts-every-10min'
);

SELECT cron.schedule(
  'check-alerts-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://vrztjjatwhpvqgcdutjf.supabase.co/functions/v1/check-alerts',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenRqamF0d2hwdnFnY2R1dGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0MDMwMiwiZXhwIjoyMDkwODE2MzAyfQ.XyPU63d1c2TOGQV6cYwR19awcSwVORGs4g4ur73RUF4'
               ),
    body    := '{}'::jsonb
  );
  $$
);
