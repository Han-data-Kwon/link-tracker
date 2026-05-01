-- ──────────────────────────────────────────────
-- 본인 링크 삭제 RLS 정책 복원
-- 006_remove_link_delete_policy.sql 에서 DROP됐던 정책 재추가
-- ──────────────────────────────────────────────
CREATE POLICY "본인 링크 삭제" ON public.links
  FOR DELETE USING (user_id = auth.uid());
