-- ──────────────────────────────────────────────
-- RLS 활성화
-- ──────────────────────────────────────────────
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks    ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- profiles
-- ──────────────────────────────────────────────
CREATE POLICY "자신의 프로필 조회"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "자신의 프로필 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ──────────────────────────────────────────────
-- links
-- ──────────────────────────────────────────────
CREATE POLICY "허용 유저 링크 조회"
  ON public.links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_allowed = TRUE
    )
  );

CREATE POLICY "허용 유저 링크 생성"
  ON public.links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_allowed = TRUE
    )
  );

CREATE POLICY "본인 링크 수정"
  ON public.links FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "본인 링크 삭제"
  ON public.links FOR DELETE
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- tags
-- ──────────────────────────────────────────────
CREATE POLICY "허용 유저 태그 조회"
  ON public.tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_allowed = TRUE
    )
  );

CREATE POLICY "허용 유저 태그 생성"
  ON public.tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_allowed = TRUE
    )
  );

-- ──────────────────────────────────────────────
-- link_tags
-- ──────────────────────────────────────────────
CREATE POLICY "허용 유저 link_tags 관리"
  ON public.link_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_allowed = TRUE
    )
  );

-- ──────────────────────────────────────────────
-- clicks: 허용 유저 SELECT / Edge Function(service_role)이 INSERT
-- ──────────────────────────────────────────────
CREATE POLICY "허용 유저 클릭 조회"
  ON public.clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_allowed = TRUE
    )
  );

-- anon 도 INSERT 가능 (리다이렉트 페이지는 미인증 상태)
CREATE POLICY "누구나 클릭 기록"
  ON public.clicks FOR INSERT
  WITH CHECK (TRUE);
