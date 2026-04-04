import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useHourlyStats } from '../../hooks/useAnalytics'
import Spinner from '../ui/Spinner'

export default function HourlyChart() {
  const { data = [], isLoading } = useHourlyStats()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        시간대별 클릭 추이 <span className="text-gray-400 font-normal text-sm">(최근 24시간)</span>
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval={2}
            />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v) => [v, '클릭 수']}
            />
            <Bar dataKey="clicks" name="클릭 수" fill="#6366f1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
