-- ──────────────────────────────────────────────
-- pg_cron 확장 활성화
-- (Supabase 대시보드 Database > Extensions에서 pg_cron이 활성화되어 있어야 합니다)
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ──────────────────────────────────────────────
-- clicks 테이블 6개월 이상 된 데이터 자동 삭제
-- 매일 새벽 3시 실행
-- ──────────────────────────────────────────────
SELECT cron.schedule(
  'cleanup-old-clicks',
  '0 3 * * *',
  $$
    DELETE FROM public.clicks
    WHERE clicked_at < NOW() - INTERVAL '6 months';
  $$
);

-- 스케줄 확인: SELECT * FROM cron.job;
-- 스케줄 제거: SELECT cron.unschedule('cleanup-old-clicks');
