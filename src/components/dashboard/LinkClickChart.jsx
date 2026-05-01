import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useLinkDailyStats } from '../../hooks/useAnalytics'
import Spinner from '../ui/Spinner'

export default function LinkClickChart({ days = 7, linkIds = [] }) {
  const { data, isLoading } = useLinkDailyStats({ days, linkIds })
  const { chartData = [], linkKeys = [], colorMap = {} } = data ?? {}

  const hasData = linkKeys.length > 0 &&
    chartData.some(d => linkKeys.some(k => (d[k] ?? 0) > 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        링크별 클릭 추이
        <span className="text-gray-400 font-normal text-sm ml-2">(최근 {days}일, 상위 5개)</span>
      </h3>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !hasData ? (
        <p className="text-center py-12 text-gray-400 text-sm">클릭 데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              labelFormatter={d => `날짜: ${d}`}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={value => (
                <span style={{ color: '#374151' }}>{value}</span>
              )}
            />
            {linkKeys.map(key => (
              <Bar
                key={key}
                dataKey={key}
                stackId="links"
                fill={colorMap[key]}
                radius={key === linkKeys[linkKeys.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
