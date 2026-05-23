import React from 'react'
import { styles, colors } from '../styles/styles'
import type { CalculationResult } from '../types'

interface Props {
  socInitial: number
  setSocInitial: (v: number) => void
  socFinal: number
  setSocFinal: (v: number) => void
  targetTime: string
  setTargetTime: (v: string) => void
  chargingPower: number
  setChargingPower: (v: number) => void
  batteryCapacity: number
  setBatteryCapacity: (v: number) => void
  locationType: 'home' | 'public'
  setLocationType: (v: 'home' | 'public') => void
  operatorCost: number
  setOperatorCost: (v: number) => void
  result: CalculationResult | null
  onCalculate: () => void
  onSave: () => void
  getEnergyCost: () => number
  calculateCost: () => number
}

const adjustPower = (current: number, delta: number, setter: (v: number) => void) => {
  let newValue = current + delta
  if (newValue < 1) newValue = 1
  if (newValue > 50) newValue = 50
  setter(parseFloat(newValue.toFixed(1)))
}

export const Planner: React.FC<Props> = ({
  socInitial, setSocInitial,
  socFinal, setSocFinal,
  targetTime, setTargetTime,
  chargingPower, setChargingPower,
  batteryCapacity, setBatteryCapacity,
  locationType, setLocationType,
  operatorCost, setOperatorCost,
  result, onCalculate, onSave, getEnergyCost, calculateCost
}) => {
  return (
    <>
      <div style={styles.card}>
        <h2 style={styles.title}>Configura ricarica</h2>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>SOC Iniziale • {socInitial}%</label>
            <input type="range" min="0" max="99" value={socInitial} onChange={(e) => setSocInitial(Number(e.target.value))} style={styles.slider} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>SOC Finale • {socFinal}%</label>
            <input type="range" min="1" max="100" value={socFinal} onChange={(e) => setSocFinal(Number(e.target.value))} style={styles.slider} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>Orario Target (auto pronta)</label>
          <div style={{ background: colors.lightGray, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
            <input type="time" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} style={{ fontSize: '40px', fontWeight: '600', fontFamily: 'monospace', border: 'none', background: 'transparent', textAlign: 'center', width: '100%', color: colors.primary }} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>Potenza ricarica • {chargingPower.toFixed(1)} kW</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => adjustPower(chargingPower, -0.5, setChargingPower)} style={{ width: '40px', height: '40px', borderRadius: '20px', background: colors.lightGray, border: 'none', fontSize: '20px', cursor: 'pointer', color: colors.primary, fontWeight: '600' }}>-</button>
            <input type="range" min="1" max="50" step="0.5" value={chargingPower} onChange={(e) => setChargingPower(parseFloat(e.target.value))} style={{ flex: 1, height: '4px', borderRadius: '2px', background: colors.border }} />
            <button onClick={() => adjustPower(chargingPower, 0.5, setChargingPower)} style={{ width: '40px', height: '40px', borderRadius: '20px', background: colors.lightGray, border: 'none', fontSize: '20px', cursor: 'pointer', color: colors.primary, fontWeight: '600' }}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={styles.label}>Capacità batteria • {batteryCapacity} kWh</label>
          <input type="range" min="20" max="100" step="1" value={batteryCapacity} onChange={(e) => setBatteryCapacity(Number(e.target.value))} style={styles.slider} />
        </div>

        <button onClick={onCalculate} style={styles.buttonPrimary}>Calcola orario inizio</button>
      </div>

      {result && (
        <div style={styles.card}>
          <h2 style={styles.title}>Risultato</h2>
          
          <div style={{ background: colors.primary, borderRadius: '20px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px' }}>INIZIA A CARICARE ALLE</div>
            <div style={{ fontSize: '48px', fontWeight: '700', color: 'white', marginBottom: '12px', letterSpacing: '-2px' }}>{result.startTime}</div>
            <div style={styles.grid3}>
              <div><div style={{ fontSize: '10px', opacity: 0.7 }}>Auto pronta</div><div style={{ fontSize: '14px', fontWeight: '600' }}>{result.endTime}</div></div>
              <div><div style={{ fontSize: '10px', opacity: 0.7 }}>Durata</div><div style={{ fontSize: '14px', fontWeight: '600' }}>{result.duration.toFixed(1)} h</div></div>
              <div><div style={{ fontSize: '10px', opacity: 0.7 }}>Energia</div><div style={{ fontSize: '14px', fontWeight: '600' }}>{result.kwhNeeded.toFixed(1)} kWh</div></div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Tipo ricarica</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setLocationType('home')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: locationType === 'home' ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: locationType === 'home' ? '#e8f0fe' : 'white', cursor: 'pointer', fontWeight: '500', color: locationType === 'home' ? colors.primary : colors.dark }}>Home</button>
              <button onClick={() => setLocationType('public')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: locationType === 'public' ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: locationType === 'public' ? '#e8f0fe' : 'white', cursor: 'pointer', fontWeight: '500', color: locationType === 'public' ? colors.primary : colors.dark }}>Pubblica</button>
            </div>
          </div>

          {locationType === 'public' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Costo operatore (€/kWh)</label>
              <input type="number" step="0.01" value={operatorCost} onChange={(e) => setOperatorCost(parseFloat(e.target.value))} style={styles.input} />
            </div>
          )}

          <div style={{ background: colors.lightGray, borderRadius: '16px', padding: '14px', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ color: colors.gray, fontSize: '12px' }}>COSTO STIMATO</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.dark }}>{calculateCost().toFixed(2)} €</div>
            <div style={{ color: colors.gray, fontSize: '11px', marginTop: '2px' }}>Costo energia: {getEnergyCost().toFixed(3)} €/kWh</div>
          </div>

          <button onClick={onSave} style={{ ...styles.buttonPrimary, background: colors.success }}>Salva ricarica</button>
        </div>
      )}
    </>
  )
}