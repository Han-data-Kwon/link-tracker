import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useDailyStats } from '../../hooks/useAnalytics'
import Spinner from '../ui/Spinner'

export default function ClickChart({ days = 30 }) {
  const { data = [], isLoading } = useDailyStats({ days })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        일별 클릭 추이 <span className="text-gray-400 font-normal text-sm">(최근 {days}일)</span>
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">클릭 데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickFormatter={d => d?.slice(5)}
            />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              labelFormatter={d => `날짜: ${d}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="impressions"
              name="전체 클릭"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="unique"
              name="순 방문자"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
