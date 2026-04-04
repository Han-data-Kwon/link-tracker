export default function Badge({ children, color = '#6366f1', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
      style={{
        backgroundColor: color + '22',
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {children}
    </span>
  )
}
