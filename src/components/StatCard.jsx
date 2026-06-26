import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function Sparkline({ data }) {
  if (!data || data.length < 2) return null
  const min   = Math.min(...data)
  const max   = Math.max(...data)
  const range = max - min || 1
  const W = 100, H = 36, PAD = 3

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const lastPt = points.split(' ').at(-1).split(',')

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={points} fill="none" stroke="#75b5b4"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill="#75b5b4"/>
    </svg>
  )
}

export default function StatCard({ title, value, suffix = '', sparklineData = [] }) {
  const hasTrend = sparklineData.length >= 2
  const trend = hasTrend
    ? ((sparklineData.at(-1) - sparklineData.at(-2)) /
       Math.abs(sparklineData.at(-2) || 1)) * 100
    : null

  const trendColor = trend === null ? '' : trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-ember' : 'text-amber-500'
  const TrendIcon  = trend === null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 border border-sky/40
                    hover:shadow-glow transition-all duration-200 flex flex-col gap-1.5
                    min-w-0 overflow-hidden">
      {/* Title — always fits, wraps if needed */}
      <p className="text-moss/55 text-[11px] font-medium uppercase tracking-wide leading-tight">
        {title}
      </p>

      {/* Value — responsive sizing */}
      <p className="font-display text-moss leading-none break-all"
         style={{ fontSize: 'clamp(1rem, 2.5vw, 1.35rem)' }}>
        {value}
        {suffix && <span className="text-xs text-moss/50 ml-0.5">{suffix}</span>}
      </p>

      {/* Trend */}
      {trend !== null && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${trendColor}`}>
          {TrendIcon && <TrendIcon className="w-3 h-3 shrink-0"/>}
          <span>{Math.abs(trend).toFixed(2)}% vs prev</span>
        </div>
      )}

      {/* Sparkline */}
      <div className="mt-1 w-full">
        <Sparkline data={sparklineData}/>
      </div>
    </div>
  )
}
