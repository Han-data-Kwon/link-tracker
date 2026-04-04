import { useNavigate } from 'react-router-dom'
import LinkTable from '../components/links/LinkTable'
import Button from '../components/ui/Button'

export default function LinksPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">링크 관리</h1>
        <Button onClick={() => navigate('/create')}>
          + 새 링크
        </Button>
      </div>
      <LinkTable />
    </div>
  )
}
