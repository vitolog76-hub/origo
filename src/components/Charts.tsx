import type { FC } from 'react'
import { styles, colors } from '../styles/styles'
import type { ChargingSession } from '../types'

interface Props {
  chargings: ChargingSession[]
}

export const Charts: FC<Props> = ({ chargings }) => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyData = Array(12).fill(0).map((_, i) => {
    const monthChargings = chargings.filter(c => {
      const date = new Date(c.date)
      return date.getMonth() === i && date.getFullYear() === currentYear
    })
    return {
      month: i,
      kwh: monthChargings.reduce((sum, c) => sum + c.kwhCharged, 0),
      cost: monthChargings.reduce((sum, c) => sum + c.totalCost, 0)
    }
  })

  const maxKwh = Math.max(...monthlyData.map(d => d.kwh), 1)
  const maxCost = Math.max(...monthlyData.map(d => d.cost), 1)

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

  return (
    <div style={styles.card}>
      <h2 style={{ ...styles.title, letterSpacing: '0.18em' }}>Statistiche mensili {currentYear}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: colors.gray, marginBottom: '8px' }}>kWh per mese</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
          {monthlyData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '100%', 
                height: `${(d.kwh / maxKwh) * 100}px`, 
                background: i === currentMonth ? colors.primary : colors.primary + '80',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s'
              }} />
              <div style={{ fontSize: '9px', marginTop: '4px', color: colors.gray }}>{months[i]}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: colors.dark }}>{d.kwh.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: colors.gray, marginBottom: '8px' }}>Costo per mese (€)</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
          {monthlyData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '100%', 
                height: `${(d.cost / maxCost) * 100}px`, 
                background: i === currentMonth ? colors.success : colors.success + '80',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s'
              }} />
              <div style={{ fontSize: '9px', marginTop: '4px', color: colors.gray }}>{months[i]}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: colors.dark }}>{d.cost.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', ...styles.grid3 }}>
        <div><div style={{ fontSize: '10px', color: colors.gray }}>Totale anno</div><div style={{ fontSize: '16px', fontWeight: '700' }}>{monthlyData.reduce((s, d) => s + d.kwh, 0).toFixed(0)} kWh</div></div>
        <div><div style={{ fontSize: '10px', color: colors.gray }}>Media mensile</div><div style={{ fontSize: '16px', fontWeight: '700' }}>{(monthlyData.reduce((s, d) => s + d.kwh, 0) / 12).toFixed(0)} kWh</div></div>
        <div><div style={{ fontSize: '10px', color: colors.gray }}>Costo medio</div><div style={{ fontSize: '16px', fontWeight: '700', color: colors.success }}>{monthlyData.reduce((s, d) => s + d.cost, 0).toFixed(0)} €</div></div>
      </div>
    </div>
  )
}