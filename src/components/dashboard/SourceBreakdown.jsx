import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useSourceBreakdown } from '../../hooks/useAnalytics'
import Spinner from '../ui/Spinner'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function SourceBreakdown() {
  const { data = [], isLoading } = useSourceBreakdown()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">소스별 트래픽</h3>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="impressions"
              nameKey="source"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={v => [v.toLocaleString(), '클릭']}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
