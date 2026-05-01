import { useTopLinks } from '../../hooks/useAnalytics'
import Spinner from '../ui/Spinner'
import Badge from '../ui/Badge'

export default function TopLinks({ linkIds = [], days = 7 }) {
  const { data: links = [], isLoading } = useTopLinks({ limit: 10, linkIds, days })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">상위 링크 (최근 {days}일, 클릭순)</h3>
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : links.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">데이터가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={link.link_id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="w-6 text-sm font-bold text-gray-400 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{link.title || link.slug}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {link.utm_campaign && <Badge color="#6366f1">{link.utm_campaign}</Badge>}
                  {link.utm_source   && <span className="text-xs text-gray-400">{link.utm_source}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{(link.total_impressions ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Uniq {(link.unique_clicks ?? 0).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
