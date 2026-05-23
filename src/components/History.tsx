import React, { useState } from 'react'
import { styles, colors } from '../styles/styles'
import type { ChargingSession } from '../types'

interface Props {
  chargings: ChargingSession[
  ]
  onDelete: (id: string) => void
  onEdit?: (c: ChargingSession) => void
}

export const History: React.FC<Props> = ({ chargings, onDelete, onEdit }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const filtered = chargings.filter(c => {
    const date = new Date(c.date)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
  })

  const totalKwh = filtered.reduce((sum, c) => sum + c.kwhCharged, 0)
  const totalCost = filtered.reduce((sum, c) => sum + c.totalCost, 0)

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Cronologia</h2>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center' }}>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={styles.input}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={styles.input}>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: colors.lightGray, borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.dark }}>{totalKwh.toFixed(0)}</div>
          <div style={{ fontSize: '11px', color: colors.gray }}>kWh</div>
        </div>
        <div style={{ flex: 1, background: colors.lightGray, borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.success }}>{totalCost.toFixed(2)} €</div>
          <div style={{ fontSize: '11px', color: colors.gray }}>Costo</div>
        </div>
        <div style={{ flex: 1, background: colors.lightGray, borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: colors.primary }}>{filtered.length}</div>
          <div style={{ fontSize: '11px', color: colors.gray }}>Ricariche</div>
        </div>
      </div>
      
      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: colors.gray }}>Nessuna ricarica</div>
        ) : (
          filtered.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '13px', color: colors.dark }}>{c.date.slice(5)}</div>
                <div style={{ fontSize: '11px', color: colors.gray }}>{c.startTime} → {c.endTime}</div>
                <div style={{ fontSize: '10px', color: colors.primary }}>{c.socInitial}%→{c.socFinal}% • {c.chargingPower}kW</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: colors.dark }}>{c.kwhCharged.toFixed(1)} kWh</div>
                <div style={{ fontWeight: '600', fontSize: '13px', color: colors.success }}>{c.totalCost.toFixed(2)} €</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {onEdit && <button onClick={() => onEdit(c)} style={{ background: colors.primary, border: 'none', color: 'white', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer' }}>Modifica</button>}
                <button onClick={() => onDelete(c.id)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: colors.danger }}>×</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}