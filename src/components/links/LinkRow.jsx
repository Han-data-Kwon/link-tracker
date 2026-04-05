import { useState } from 'react'
import { format } from 'date-fns'
import { useToggleLinkActive } from '../../hooks/useLinks'
import Badge from '../ui/Badge'
import QRModal from './QRModal'
import AlertSettings from './AlertSettings'

export default function LinkRow({ link }) {
  const [qrOpen,    setQrOpen]    = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [copied,    setCopied]    = useState(false)
  const toggleActive = useToggleLinkActive()

  const linkId  = link.link_id || link.id
  const trackUrl = `${window.location.origin}/r/${link.slug}`

  function copyUrl() {
    navigator.clipboard.writeText(trackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <tr className={`border-b border-gray-100 ${link.is_active ? 'hover:bg-gray-50' : 'opacity-50 bg-gray-50 grayscale-[30%]'}`}>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-gray-900">{link.title || '(제목 없음)'}</span>
            <a
              href={link.full_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-primary-600 font-mono truncate max-w-xs"
            >
              {link.full_url}
            </a>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-mono text-primary-600">/r/{link.slug}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            {link.utm_source   && <span className="text-xs text-gray-500">src: {link.utm_source}</span>}
            {link.utm_medium   && <span className="text-xs text-gray-500">med: {link.utm_medium}</span>}
            {link.utm_campaign && <Badge color="#6366f1">{link.utm_campaign}</Badge>}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-gray-900">{link.total_impressions ?? 0}</span>
            <span className="text-xs text-gray-400">Unique: {link.unique_clicks ?? 0}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {link.created_at ? format(new Date(link.created_at), 'yyyy-MM-dd HH:mm') : '-'}
          </span>
        </td>
        <td className="px-4 py-3">
          {link.is_active ? (
            <button
              onClick={() => toggleActive.mutate({ id: linkId, is_active: false })}
              className="relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none bg-primary-600"
            >
              <span className="inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform translate-x-4" />
            </button>
          ) : (
            <button
              onClick={() => toggleActive.mutate({ id: linkId, is_active: true })}
              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors whitespace-nowrap"
            >
              재활성화
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={copyUrl}
              title="URL 복사"
              className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              {copied
                ? <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              }
            </button>
            <button
              onClick={() => setQrOpen(true)}
              title="QR 코드"
              className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
            <button
              onClick={() => setAlertOpen(true)}
              title="레이더 알림 설정"
              className="p-1.5 rounded hover:bg-orange-100 text-gray-400 hover:text-orange-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      <QRModal open={qrOpen} onClose={() => setQrOpen(false)} link={link} />
      <AlertSettings
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        linkId={linkId}
        linkTitle={link.title || link.slug}
      />
    </>
  )
}
