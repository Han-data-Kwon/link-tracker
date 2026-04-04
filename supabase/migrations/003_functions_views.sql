-- ──────────────────────────────────────────────
-- updated_at 자동 갱신 트리거
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────
-- Google 로그인 시 profiles 자동 생성
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────
-- VIEW: 링크별 일별 클릭 통계
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
  DATE(c.clicked_at)                    AS click_date,
  COUNT(c.id)                           AS total_impressions,
  COUNT(DISTINCT c.visitor_id)          AS unique_clicks
FROM public.links l
LEFT JOIN public.clicks c ON l.id = c.link_id
GROUP BY
  l.id, l.slug, l.title,
  l.utm_source, l.utm_medium, l.utm_campaign,
  l.user_id, DATE(c.clicked_at);

-- ──────────────────────────────────────────────
-- VIEW: 링크별 전체 합산 통계
-- ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.link_total_stats AS
SELECT
  l.id              AS link_id,
  l.slug,
  l.title,
  l.full_url,
  l.destination_url,
  l.utm_source,
  l.utm_medium,
  l.utm_campaign,
  l.utm_term,
  l.utm_content,
  l.is_active,
  l.created_at,
  l.user_id,
  COUNT(c.id)                           AS total_impressions,
  COUNT(DISTINCT c.visitor_id)          AS unique_clicks,
  MAX(c.clicked_at)                     AS last_clicked_at
FROM public.links l
LEFT JOIN public.clicks c ON l.id = c.link_id
GROUP BY l.id;

-- ──────────────────────────────────────────────
-- VIEW: 태그별 클릭 통계
-- ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.tag_stats AS
SELECT
  t.id              AS tag_id,
  t.name            AS tag_name,
  t.color,
  COUNT(DISTINCT lt.link_id)            AS link_count,
  COUNT(c.id)                           AS total_impressions,
  COUNT(DISTINCT c.visitor_id)          AS unique_clicks
FROM public.tags t
LEFT JOIN public.link_tags lt ON t.id = lt.tag_id
LEFT JOIN public.clicks c    ON lt.link_id = c.link_id
GROUP BY t.id, t.name, t.color;

-- ──────────────────────────────────────────────
-- FUNCTION: 슬러그로 링크 조회 (RedirectPage 사용)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_link_by_slug(p_slug TEXT)
RETURNS TABLE (
  id          UUID,
  full_url    TEXT,
  is_active   BOOLEAN,
  expires_at  TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, full_url, is_active, expires_at
  FROM public.links
  WHERE slug = p_slug
  LIMIT 1;
$$;
