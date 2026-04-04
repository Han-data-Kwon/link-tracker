const VISITOR_KEY = 'lt_visitor_id'

/**
 * localStorage 기반 방문자 고유 ID 반환
 * 없으면 생성 후 저장
 */
export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}
