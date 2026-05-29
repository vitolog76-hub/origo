import React, { useState } from 'react'
import type { ChargingSession } from '../types'

interface Props {
  chargings: ChargingSession[]
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
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
        Cronologia Ricariche
      </h2>
      
      {/* SELETTORI MESE / ANNO TECH */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(Number(e.target.value))} 
          style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #3f3f46', background: '#18181b', color: '#ffffff', outline: 'none', fontSize: '14px' }}
        >
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(Number(e.target.value))} 
          style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #3f3f46', background: '#18181b', color: '#ffffff', outline: 'none', fontSize: '14px' }}
        >
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {/* CONTATORI MENSILI TRASPARENTI (GLASS) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: 'rgba(24, 24, 27, 0.5)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(63, 63, 70, 0.3)', backdropFilter: 'blur(4px)' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#3b82f6' }}>{totalKwh.toFixed(0)}</div>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginTop: '2px' }}>kWh Totali</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(24, 24, 27, 0.5)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(63, 63, 70, 0.3)', backdropFilter: 'blur(4px)' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>€ {totalCost.toFixed(2)}</div>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginTop: '2px' }}>Spesa Mese</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(24, 24, 27, 0.5)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(63, 63, 70, 0.3)', backdropFilter: 'blur(4px)' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#e4e4e7' }}>{filtered.length}</div>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginTop: '2px' }}>Sessioni</div>
        </div>
      </div>
      
      {/* LISTA RICARICHE FLUIDA */}
      <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#71717a', fontSize: '14px', border: '1px dashed #27272a', borderRadius: '12px' }}>
            Nessun flusso dati registrato in questo mese.
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid rgba(63, 63, 70, 0.3)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#ffffff' }}>
                  {new Date(c.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>{c.startTime} → {c.endTime}</div>
                <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '600', marginTop: '1px' }}>
                  {c.socInitial}% → {c.socFinal}% • {c.chargingPower}kW
                </div>
              </div>
              
              <div style={{ textAlign: 'right', marginRight: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>{c.kwhCharged.toFixed(1)} kWh</div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#10b981', marginTop: '2px' }}>€ {c.totalCost.toFixed(2)}</div>
              </div>

              {/* PULSANTI CONTROLLO AZIONI */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {onEdit && (
                  <button 
                    onClick={() => onEdit(c)} 
                    style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#e4e4e7', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s' }}
                  >
                    Modifica
                  </button>
                )}
                <button 
                  onClick={() => onDelete(c.id)} 
                  style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#ef4444', padding: '0 4px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}