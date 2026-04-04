/**
 * UTM 파라미터가 포함된 전체 URL 생성
 * @param {string} destinationUrl - 원본 URL
 * @param {object} utm - { source, medium, campaign, term, content }
 * @returns {string} UTM 파라미터 포함 URL
 */
export function buildUtmUrl(destinationUrl, utm) {
  if (!destinationUrl) return ''
  try {
    const url = new URL(destinationUrl)
    if (utm.source)   url.searchParams.set('utm_source',   utm.source)
    if (utm.medium)   url.searchParams.set('utm_medium',   utm.medium)
    if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign)
    if (utm.term)     url.searchParams.set('utm_term',     utm.term)
    if (utm.content)  url.searchParams.set('utm_content',  utm.content)
    return url.toString()
  } catch {
    return destinationUrl
  }
}

/**
 * URL에서 UTM 파라미터 파싱
 */
export function parseUtmFromUrl(fullUrl) {
  try {
    const url = new URL(fullUrl)
    return {
      source:   url.searchParams.get('utm_source')   || '',
      medium:   url.searchParams.get('utm_medium')   || '',
      campaign: url.searchParams.get('utm_campaign') || '',
      term:     url.searchParams.get('utm_term')     || '',
      content:  url.searchParams.get('utm_content')  || '',
    }
  } catch {
    return { source: '', medium: '', campaign: '', term: '', content: '' }
  }
}
