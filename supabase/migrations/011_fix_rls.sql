-- ──────────────────────────────────────────────
-- links UPDATE / DELETE RLS 정책 보정 (idempotent)
-- 기존 정책을 DROP 후 재생성하여 충돌 방지
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "본인 링크 수정" ON public.links;
DROP POLICY IF EXISTS "본인 링크 삭제" ON public.links;

CREATE POLICY "본인 링크 수정" ON public.links
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "본인 링크 삭제" ON public.links
  FOR DELETE USING (user_id = auth.uid());
