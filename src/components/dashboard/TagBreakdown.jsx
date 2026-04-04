import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useTagStats } from '../../hooks/useAnalytics'
import Spinner from '../ui/Spinner'

export default function TagBreakdown({ linkIds = [] }) {
  const { data = [], isLoading } = useTagStats({ linkIds })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">태그별 클릭 현황</h3>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">태그 데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="tag_name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              width={80}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v, name) => [v.toLocaleString(), name === 'total_impressions' ? '전체 클릭' : '순 방문자']}
            />
            <Bar dataKey="total_impressions" name="total_impressions" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || '#6366f1'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
