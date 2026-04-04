import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useAllAlerts, useRecentAlertLogs } from '../../hooks/useAlerts'
import Spinner from '../ui/Spinner'

const TYPE_CONFIG = {
  traffic_spike: { label: '급증',   bg: 'bg-orange-100', text: 'text-orange-700' },
  no_traffic:    { label: '무클릭', bg: 'bg-blue-100',   text: 'text-blue-700'  },
}

function AlertBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? { label: type, bg: 'bg-gray-100', text: 'text-gray-600' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default function RadarSection() {
  const { data: alerts = [],    isLoading: loadingAlerts } = useAllAlerts()
  const { data: logs   = [],    isLoading: loadingLogs   } = useRecentAlertLogs(10)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 활성 알림 조건 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">
            활성 알림 조건
            <span className="ml-2 text-gray-400 font-normal text-sm">({alerts.length}개)</span>
          </h2>
        </div>

        {loadingAlerts ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : alerts.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">활성화된 알림 조건이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map(alert => {
              const link = alert.links ?? {}
              return (
                <li key={alert.id} className="px-5 py-3 flex items-center gap-3">
                  <AlertBadge type={alert.alert_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {link.title || link.slug || '(링크 없음)'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {alert.alert_type === 'traffic_spike'
                        ? `평균 대비 ${alert.threshold}배 이상 → ${alert.recipient_email}`
                        : `${alert.threshold}시간 무클릭 → ${alert.recipient_email}`}
                    </p>
                  </div>
                  <span className="shrink-0 w-2 h-2 rounded-full bg-green-400" title="활성" />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 최근 알림 발송 이력 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">최근 알림 이력</h2>
        </div>

        {loadingLogs ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : logs.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">발송된 알림이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map(log => {
              const alert = log.alerts ?? {}
              const link  = alert.links ?? {}
              return (
                <li key={log.id} className="px-5 py-3 flex items-center gap-3">
                  <AlertBadge type={alert.alert_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {link.title || link.slug || log.details?.link_title || '(링크 없음)'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {alert.alert_type === 'traffic_spike'
                        ? `평균 대비 ${alert.threshold}배 초과`
                        : `${alert.threshold}시간 무클릭`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true, locale: ko })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
