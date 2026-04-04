-- ──────────────────────────────────────────────
-- link_daily_stats 뷰에 is_active 컬럼 추가
-- useAnalytics.js에서 is_active = true 필터링에 사용
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
  DATE(c.clicked_at)               AS click_date,
  COUNT(c.id)                      AS total_impressions,
  COUNT(DISTINCT c.visitor_id)     AS unique_clicks
FROM public.links l
LEFT JOIN public.clicks c ON l.id = c.link_id
GROUP BY
  l.id, l.slug, l.title,
  l.utm_source, l.utm_medium, l.utm_campaign,
  l.user_id, l.is_active, DATE(c.clicked_at);
