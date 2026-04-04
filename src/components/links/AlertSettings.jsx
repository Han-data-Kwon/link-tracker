import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Spinner from '../ui/Spinner'
import { useAlerts, useCreateAlert, useDeleteAlert, useToggleAlert } from '../../hooks/useAlerts'

const TYPE_LABELS = {
  traffic_spike: '트래픽 급증',
  no_traffic:    '트래픽 없음',
}

const TYPE_HINT = {
  traffic_spike: '평균 대비 배수 (예: 3 = 시간당 평균의 3배 이상)',
  no_traffic:    '무클릭 판정 시간 (예: 24 = 24시간 동안 클릭 없음)',
}

const TYPE_UNIT = {
  traffic_spike: '배',
  no_traffic:    '시간',
}

const DEFAULT_FORM = {
  alertType:      'traffic_spike',
  threshold:      '',
  recipientEmail: '',
}

export default function AlertSettings({ linkId, linkTitle, open, onClose }) {
  const [form, setForm]     = useState(DEFAULT_FORM)
  const [formError, setFormError] = useState('')

  const { data: alerts = [], isLoading } = useAlerts(linkId)
  const createAlert  = useCreateAlert()
  const deleteAlert  = useDeleteAlert()
  const toggleAlert  = useToggleAlert()

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const threshold = Number(form.threshold)
    if (!threshold || threshold <= 0) {
      setFormError('임계값은 0보다 커야 합니다.')
      return
    }
    if (!form.recipientEmail.includes('@')) {
      setFormError('유효한 이메일을 입력해주세요.')
      return
    }
    try {
      await createAlert.mutateAsync({
        linkId,
        alertType:      form.alertType,
        threshold,
        recipientEmail: form.recipientEmail,
      })
      setForm(DEFAULT_FORM)
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`레이더 알림 설정 — ${linkTitle || linkId}`} size="md">
      <div className="space-y-6">

        {/* 기존 알림 목록 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">등록된 알림 조건</h3>
          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
              등록된 알림 조건이 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {alerts.map(alert => (
                <li key={alert.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    alert.alert_type === 'traffic_spike'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {TYPE_LABELS[alert.alert_type]}
                  </span>
                  <span className="text-sm text-gray-800 flex-1 min-w-0">
                    {alert.alert_type === 'traffic_spike'
                      ? `평균 대비 ${alert.threshold}배 이상`
                      : `${alert.threshold}시간 무클릭`}
                    <span className="ml-2 text-gray-400 text-xs truncate">{alert.recipient_email}</span>
                  </span>
                  {/* 활성 토글 */}
                  <button
                    onClick={() => toggleAlert.mutate({ id: alert.id, is_active: !alert.is_active })}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                      alert.is_active ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                      alert.is_active ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <button
                    onClick={() => deleteAlert.mutate(alert.id)}
                    className="shrink-0 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 신규 알림 추가 폼 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">새 알림 추가</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">조건 유형</label>
              <select
                value={form.alertType}
                onChange={e => handleChange('alertType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="traffic_spike">트래픽 급증 — 최근 1시간이 시간당 평균의 N배 이상</option>
                <option value="no_traffic">트래픽 없음 — N시간 동안 클릭 없음</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                임계값 ({TYPE_UNIT[form.alertType]})
              </label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                placeholder={form.alertType === 'traffic_spike' ? '예: 3' : '예: 24'}
                value={form.threshold}
                onChange={e => handleChange('threshold', e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">{TYPE_HINT[form.alertType]}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">수신 이메일</label>
              <Input
                type="email"
                placeholder="alert@example.com"
                value={form.recipientEmail}
                onChange={e => handleChange('recipientEmail', e.target.value)}
                className="w-full"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-500">{formError}</p>
            )}

            <Button
              type="submit"
              loading={createAlert.isPending}
              className="w-full justify-center"
            >
              알림 추가
            </Button>
          </form>
        </section>
      </div>
    </Modal>
  )
}
