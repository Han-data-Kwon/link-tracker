import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LinkForm from '../components/links/LinkForm'
import CsvUpload from '../components/links/CsvUpload'

const TABS = [
  { id: 'single', label: '단건 생성' },
  { id: 'csv',    label: 'CSV 업로드' },
]

export default function CreateLinkPage() {
  const [tab, setTab] = useState('single')
  const navigate = useNavigate()

  function handleSuccess() {
    navigate('/links')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">링크 생성</h1>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {tab === 'single' && <LinkForm onSuccess={handleSuccess} />}
        {tab === 'csv'    && <CsvUpload onSuccess={handleSuccess} />}
      </div>
    </div>
  )
}
