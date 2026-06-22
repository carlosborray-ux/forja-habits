'use client'

const OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

function to12(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const period = h < 12 ? 'am' : 'pm'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mStr} ${period}`
}

export default function TimeSelect({ value, onChange, className, style }: {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className ?? 'input-glass'} style={style}>
      {!value && <option value="">-- hora --</option>}
      {value && !OPTIONS.includes(value) && <option value={value}>{to12(value)}</option>}
      {OPTIONS.map(o => <option key={o} value={o}>{to12(o)}</option>)}
    </select>
  )
}
