import Papa from 'papaparse'
import { buildUtmUrl } from './utm'
import { generateSlug } from './slug'

/**
 * CSV 파일 파싱 후 링크 배열 반환
 * 필수 컬럼: destination_url
 * 선택 컬럼: title, utm_source, utm_medium, utm_campaign, utm_term, utm_content, slug, tags
 */
export function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) return reject(new Error(errors[0].message))

        const links = []
        const parseErrors = []

        data.forEach((row, i) => {
          const destination_url = row.destination_url?.trim()
          if (!destination_url) {
            parseErrors.push(`행 ${i + 2}: destination_url 없음`)
            return
          }
          try {
            new URL(destination_url)
          } catch {
            parseErrors.push(`행 ${i + 2}: 잘못된 URL (${destination_url})`)
            return
          }

          const utm = {
            source:   row.utm_source?.trim()   || '',
            medium:   row.utm_medium?.trim()   || '',
            campaign: row.utm_campaign?.trim() || '',
            term:     row.utm_term?.trim()     || '',
            content:  row.utm_content?.trim()  || '',
          }

          links.push({
            slug:            row.slug?.trim() || generateSlug(),
            title:           row.title?.trim() || '',
            destination_url,
            full_url:        buildUtmUrl(destination_url, utm),
            utm_source:      utm.source,
            utm_medium:      utm.medium,
            utm_campaign:    utm.campaign,
            utm_term:        utm.term,
            utm_content:     utm.content,
            tags:            row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          })
        })

        resolve({ links, errors: parseErrors })
      },
      error: reject,
    })
  })
}

export const CSV_TEMPLATE_HEADERS = [
  'destination_url',
  'title',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'slug',
  'tags',
].join(',')

export const CSV_TEMPLATE_EXAMPLE =
  `${CSV_TEMPLATE_HEADERS}\nhttps://example.com,홈페이지,google,cpc,spring2024,,,abc12345,"sns,paid"`
