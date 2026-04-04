import { useState } from 'react'
import { useLinks } from '../../hooks/useLinks'
import LinkRow from './LinkRow'
import Input from '../ui/Input'
import Spinner from '../ui/Spinner'

export default function LinkTable() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [timer, setTimer] = useState(null)

  const { data: links = [], isLoading, error } = useLinks({ search: debouncedSearch })

  function handleSearch(val) {
    setSearch(val)
    clearTimeout(timer)
    setTimer(setTimeout(() => setDebouncedSearch(val), 300))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-900">
          링크 목록 <span className="text-gray-400 font-normal text-sm">({links.length}개)</span>
        </h2>
        <Input
          placeholder="제목, 슬러그, 캠페인 검색..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-64"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <p className="text-center py-12 text-red-500 text-sm">{error.message}</p>
      ) : links.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">
          {search ? '검색 결과가 없습니다' : '아직 생성된 링크가 없습니다'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['링크', '슬러그', 'UTM', '클릭', '생성일시', '활성', '액션'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map(link => (
                <LinkRow key={link.link_id || link.id} link={link} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
