-- ──────────────────────────────────────────────
-- clicked_at UTC → KST(Asia/Seoul) 기준 날짜 집계 수정
-- 기존: DATE(c.clicked_at) → UTC 기준으로 하루 차이 발생
-- 변경: DATE(c.clicked_at AT TIME ZONE 'Asia/Seoul') → KST 기준
-- ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.link_daily_stats AS
SELECT
  l.id              AS link_id,
  l.slug,
  l.title,
  l.utm_source,
  l.utm_medium,
  l.utm_campaign,
  l.user_id,
  l.is_active,
  DATE(c.clicked_at AT TIME ZONE 'Asia/Seoul') AS click_date,
  COUNT(c.id)                      AS total_impressions,
  COUNT(DISTINCT c.visitor_id)     AS unique_clicks
FROM public.links l
LEFT JOIN public.clicks c ON l.id = c.link_id
GROUP BY
  l.id, l.slug, l.title,
  l.utm_source, l.utm_medium, l.utm_campaign,
  l.user_id, l.is_active,
  DATE(c.clicked_at AT TIME ZONE 'Asia/Seoul');
