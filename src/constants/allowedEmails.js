/**
 * Google SSO 로그인 허용 이메일 목록
 * 빈 배열이면 모든 이메일 허용 (개발용)
 * 도메인 허용 예: '@company.com'
 */
export const ALLOWED_EMAILS = [
  // 'user@example.com',
  // '@mycompany.com',  // 도메인 전체 허용
]

/**
 * 이메일이 허용 목록에 있는지 확인
 */
export function isEmailAllowed(email) {
  if (!email) return false
  if (ALLOWED_EMAILS.length === 0) return true // 개발모드: 전체 허용

  return ALLOWED_EMAILS.some(rule => {
    if (rule.startsWith('@')) return email.endsWith(rule)
    return email === rule
  })
}
