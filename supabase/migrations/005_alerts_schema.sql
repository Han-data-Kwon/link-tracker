-- ──────────────────────────────────────────────
-- pg_net 확장 (Edge Function 호출용)
-- Supabase 프로젝트에는 기본 활성화되어 있음
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ──────────────────────────────────────────────
-- alerts 테이블 (알림 조건 저장)
-- ──────────────────────────────────────────────
CREATE TABLE public.alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id         UUID        NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  alert_type      TEXT        NOT NULL
                              CHECK (alert_type IN ('traffic_spike', 'no_traffic')),

  -- traffic_spike: 평균 대비 몇 배 이상 (예: 3.0 = 3배)
  -- no_traffic:    클릭 없음 판정 시간(시간 단위, 예: 24)
  threshold       NUMERIC     NOT NULL CHECK (threshold > 0),

  recipient_email TEXT        NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_link_id   ON public.alerts (link_id);
CREATE INDEX idx_alerts_user_id   ON public.alerts (user_id);
CREATE INDEX idx_alerts_is_active ON public.alerts (is_active) WHERE is_active = TRUE;

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────
-- alert_logs 테이블 (발송 이력)
-- ──────────────────────────────────────────────
CREATE TABLE public.alert_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id     UUID        NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details      JSONB
);

CREATE INDEX idx_alert_logs_alert_id     ON public.alert_logs (alert_id);
CREATE INDEX idx_alert_logs_triggered_at ON public.alert_logs (triggered_at DESC);

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────
ALTER TABLE public.alerts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- alerts: 본인 레코드만 접근
CREATE POLICY "본인 알림 조회"
  ON public.alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "본인 알림 생성"
  ON public.alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "본인 알림 수정"
  ON public.alerts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "본인 알림 삭제"
  ON public.alerts FOR DELETE
  USING (user_id = auth.uid());

-- alert_logs: 본인 alerts에 속한 로그만 조회
CREATE POLICY "본인 알림 로그 조회"
  ON public.alert_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alerts
      WHERE alerts.id = alert_logs.alert_id
        AND alerts.user_id = auth.uid()
    )
  );

-- Edge Function(service_role)이 INSERT
CREATE POLICY "서비스롤 로그 기록"
  ON public.alert_logs FOR INSERT
  WITH CHECK (TRUE);

-- ──────────────────────────────────────────────
-- pg_cron: 15분마다 check-alerts Edge Function 호출
--
-- 아래 URL과 SERVICE_ROLE_KEY를 본인 Supabase 프로젝트 값으로 교체하세요.
-- 프로젝트 URL: Supabase Dashboard > Project Settings > API
-- ──────────────────────────────────────────────
/*
SELECT cron.schedule(
  'check-alerts-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/check-alerts',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
               ),
    body    := '{}'::jsonb
  );
  $$
);
*/
