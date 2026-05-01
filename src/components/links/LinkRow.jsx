import { useState } from 'react'
import { format } from 'date-fns'
import { useToggleLinkActive, useDeleteLink } from '../../hooks/useLinks'
import { useAuth } from '../../hooks/useAuth'
import Badge from '../ui/Badge'
import QRModal from './QRModal'
import AlertSettings from './AlertSettings'
import LinkEditModal from './LinkEditModal'

export default function LinkRow({ link }) {
  const [qrOpen,     setQrOpen]     = useState(false)
  const [alertOpen,  setAlertOpen]  = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copied,     setCopied]     = useState(false)

  const toggleActive = useToggleLinkActive()
  const deleteLink   = useDeleteLink()
  const { user, profile } = useAuth()

  const linkId   = link.link_id || link.id
  const canEdit  = profile?.role === 'admin' || link.user_id === user?.id
  const trackUrl = `${window.location.origin}/r/${link.slug}`

  function copyUrl() {
    navigator.clipboard.writeText(trackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleDelete() {
    await deleteLink.mutateAsync(linkId)
    setDeleteOpen(false)
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
          {canEdit && (link.is_active ? (
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
          ))}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {/* URL 복사 */}
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
            {/* QR 코드 */}
            <button
              onClick={() => setQrOpen(true)}
              title="QR 코드"
              className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
            {/* 알림 설정 */}
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
            {/* 링크 수정 */}
            {canEdit && (
              <button
                onClick={() => setEditOpen(true)}
                title="링크 수정"
                className="p-1.5 rounded hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {/* 링크 삭제 */}
            {canEdit && (
              <button
                onClick={() => setDeleteOpen(true)}
                title="링크 삭제"
                className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
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
      <LinkEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        link={link}
      />

      {/* 삭제 확인 모달 */}
      {deleteOpen && (
        <tr>
          <td colSpan={7}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">링크를 삭제할까요?</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{link.title || link.slug}</p>
                  </div>
                </div>
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-5">
                  삭제 시 클릭 데이터도 함께 삭제됩니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLink.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleteLink.isPending ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
