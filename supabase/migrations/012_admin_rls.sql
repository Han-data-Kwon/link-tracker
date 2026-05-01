-- ──────────────────────────────────────────────
-- admin이 모든 링크를 수정/삭제할 수 있도록 RLS 정책 업데이트
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "본인 링크 수정" ON public.links;
DROP POLICY IF EXISTS "본인 링크 삭제" ON public.links;

CREATE POLICY "본인 링크 수정" ON public.links
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "본인 링크 삭제" ON public.links
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ──────────────────────────────────────────────
-- admin 권한 부여 (Supabase SQL Editor에서 직접 실행)
-- ──────────────────────────────────────────────
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'khanseo1989@gmail.com';
