import React from 'react'
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
  saveMessage?: string | null
  saveError?: string | null
}

const adjustPower = (current: number, delta: number, setter: (v: number) => void) => {
  let newValue = current + delta
  if (newValue < 1) newValue = 1
  if (newValue > 50) newValue = 50
  setter(parseFloat(newValue.toFixed(1)))
}

const adjustInteger = (current: number, delta: number, setter: (v: number) => void, min: number, max: number) => {
  let newValue = current + delta
  if (newValue < min) newValue = min
  if (newValue > max) newValue = max
  setter(newValue)
}

export const Planner: React.FC<Props> = ({
  socInitial, setSocInitial,
  socFinal, setSocFinal,
  targetTime, setTargetTime,
  chargingPower, setChargingPower,
  batteryCapacity, setBatteryCapacity,
  locationType, setLocationType,
  operatorCost, setOperatorCost,
  result, onCalculate, onSave, getEnergyCost, calculateCost,
  saveMessage, saveError
}) => {

  const localStyles = {
    // LA CARD: Solida, scura ed elegante, perfetta sopra a qualsiasi sfondo esterno
    card: {
      background: '#110d19',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid rgba(37, 99, 235, 0.25)', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      marginBottom: '20px',
      position: 'relative' as const,
      zIndex: 1 
    },
    title: {
      fontFamily: 'var(--heading)',
      fontSize: '22px',
      fontWeight: '600' as const,
      color: '#ffffff',
      margin: '0 0 20px 0',
      letterSpacing: '-0.5px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#cbd5e1', 
      fontWeight: '500' as const,
      fontSize: '13px',
      letterSpacing: '0.2px',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      fontSize: '16px',
      boxSizing: 'border-box' as const,
      background: 'rgba(0, 0, 0, 0.4)', 
      color: '#ffffff',
      outline: 'none',
    },
    btnCounter: {
      width: '42px',
      height: '42px',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '500' as const
    },
    slider: {
      width: '100%',
      height: '6px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '3px',
      outline: 'none',
      marginTop: '10px'
    }
  }

  return (
    <>
      <style>{`
        /* Pulizia totale: forziamo la trasparenza su tutti i possibili container dell'app */
        body, #root, main, .App, 
        [class*="layout"], [class*="wrapper"], [class*="container"], [class*="content"] {
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
        }

        header, nav, [class*="nav"], [class*="header"], [class*="menu"] {
          background-color: rgba(6, 5, 9, 0.6) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          position: relative !important;
          z-index: 2 !important; 
        }

        .btn-interactive-primary {
          background: linear-gradient(180deg, rgba(37, 99, 235, 0.24), rgba(15, 23, 42, 0.92));
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 16px;
          border-radius: 18px;
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          width: 100%;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 20px 42px rgba(79,70,229,0.18);
          margin-top: 10px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .btn-interactive-primary:hover {
          filter: brightness(1.08);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16), 0 26px 52px rgba(79,70,229,0.28);
          transform: translateY(-1px);
        }
        .btn-interactive-primary:active {
          filter: brightness(0.95);
          transform: translateY(1px);
        }

        .btn-interactive-success {
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.24), rgba(6, 78, 50, 0.92));
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 16px;
          border-radius: 18px;
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          width: 100%;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 20px 42px rgba(16,185,129,0.18);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .btn-interactive-success:hover {
          filter: brightness(1.08);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16), 0 26px 52px rgba(16,185,129,0.28);
          transform: translateY(-1px);
        }
        .btn-interactive-success:active {
          filter: brightness(0.95);
          transform: translateY(1px);
        }

        .btn-location {
          flex: 1;
          padding: 12px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #e5e7eb;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 10px 24px rgba(0,0,0,0.14);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .btn-location:hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 14px 30px rgba(0,0,0,0.18);
        }
        .btn-location:active {
          transform: translateY(1px);
        }
      `}</style>

      <div style={localStyles.card}>
        <h2 style={localStyles.title}>Configura ricarica</h2>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={localStyles.label}>SOC Iniziale • {socInitial}%</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
              <button onClick={() => adjustInteger(socInitial, -1, setSocInitial, 0, 99)} style={localStyles.btnCounter}>-</button>
              <input type="number" min="0" max="99" value={socInitial} onChange={(e) => setSocInitial(Math.min(99, Math.max(0, Number(e.target.value))))} style={{ ...localStyles.input, textAlign: 'center' }} />
              <button onClick={() => adjustInteger(socInitial, 1, setSocInitial, 0, 99)} style={localStyles.btnCounter}>+</button>
            </div>
            <input type="range" min="0" max="99" value={socInitial} onChange={(e) => setSocInitial(Number(e.target.value))} style={localStyles.slider} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={localStyles.label}>SOC Finale • {socFinal}%</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
              <button onClick={() => adjustInteger(socFinal, -1, setSocFinal, 1, 100)} style={localStyles.btnCounter}>-</button>
              <input type="number" min="1" max="100" value={socFinal} onChange={(e) => setSocFinal(Math.min(100, Math.max(1, Number(e.target.value))))} style={{ ...localStyles.input, textAlign: 'center' }} />
              <button onClick={() => adjustInteger(socFinal, 1, setSocFinal, 1, 100)} style={localStyles.btnCounter}>+</button>
            </div>
            <input type="range" min="1" max="100" value={socFinal} onChange={(e) => setSocFinal(Number(e.target.value))} style={localStyles.slider} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={localStyles.label}>Orario Target (auto pronta)</label>
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '14px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <input type="time" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} style={{ fontSize: '36px', fontWeight: '700', fontFamily: 'var(--sans)', border: 'none', background: 'transparent', textAlign: 'center', width: '100%', color: 'var(--accent)', outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={localStyles.label}>Potenza ricarica • {chargingPower.toFixed(1)} kW</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => adjustPower(chargingPower, -0.5, setChargingPower)} style={localStyles.btnCounter}>-</button>
            <input type="range" min="1" max="50" step="0.5" value={chargingPower} onChange={(e) => setChargingPower(parseFloat(e.target.value))} style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '3px', outline: 'none' }} />
            <button onClick={() => adjustPower(chargingPower, 0.5, setChargingPower)} style={localStyles.btnCounter}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={localStyles.label}>Capacità batteria • {batteryCapacity} kWh</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
            <button onClick={() => adjustInteger(batteryCapacity, -1, setBatteryCapacity, 20, 100)} style={localStyles.btnCounter}>-</button>
            <input type="number" min="20" max="100" value={batteryCapacity} onChange={(e) => setBatteryCapacity(Math.min(100, Math.max(20, Number(e.target.value))))} style={{ ...localStyles.input, textAlign: 'center' }} />
            <button onClick={() => adjustInteger(batteryCapacity, 1, setBatteryCapacity, 20, 100)} style={localStyles.btnCounter}>+</button>
          </div>
          <input type="range" min="20" max="100" step="1" value={batteryCapacity} onChange={(e) => setBatteryCapacity(Number(e.target.value))} style={localStyles.slider} />
        </div>

        {saveMessage && (
          <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '14px', fontWeight: '500' }}>
            {saveMessage}
          </div>
        )}

        {saveError && (
          <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '14px', fontWeight: '500' }}>
            {saveError}
          </div>
        )}

        <button onClick={onCalculate} className="btn-interactive-primary">Calcola orario inizio</button>
      </div>

      {result && (
        <div style={localStyles.card}>
          <h2 style={localStyles.title}>Risultato del calcolo</h2>
          
          <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
            <div style={{ color: '#93c5fd', fontSize: '11px', marginBottom: '4px', fontWeight: '600', letterSpacing: '1px' }}>START CHARGING PROCESS AT</div>
            <div style={{ fontSize: '46px', fontWeight: '800', color: '#ffffff', marginBottom: '14px', letterSpacing: '-1px' }}>{result.startTime}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
              <div><div style={{ fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase' }}>Target</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>{result.endTime}</div></div>
              <div><div style={{ fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase' }}>Duration</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>{result.duration.toFixed(1)}h</div></div>
              <div><div style={{ fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase' }}>Energy</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>{result.kwhNeeded.toFixed(1)} kWh</div></div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={localStyles.label}>Tipo ricarica</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setLocationType('home')} 
                className="btn-location"
                style={{ 
                  border: locationType === 'home' ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.1)', 
                  background: locationType === 'home' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(0, 0, 0, 0.3)', 
                  color: locationType === 'home' ? '#ffffff' : '#9ca3af' 
                }}
              >
                HOME STATION
              </button>
              <button 
                onClick={() => setLocationType('public')} 
                className="btn-location"
                style={{ 
                  border: locationType === 'public' ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.1)', 
                  background: locationType === 'public' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(0, 0, 0, 0.3)', 
                  color: locationType === 'public' ? '#ffffff' : '#9ca3af' 
                }}
              >
                PUBLIC STATION
              </button>
            </div>
          </div>

          {locationType === 'public' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={localStyles.label}>Costo operatore (€/kWh)</label>
              <input type="number" step="0.01" value={operatorCost} onChange={(e) => setOperatorCost(parseFloat(e.target.value))} style={localStyles.input} />
            </div>
          )}

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '14px', padding: '16px', textAlign: 'center', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>ESTIMATED SESSION COST</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>{calculateCost().toFixed(2)} €</div>
            <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '4px', fontFamily: 'var(--sans)' }}>Rate: {getEnergyCost().toFixed(3)} €/kWh</div>
          </div>

          <button onClick={onSave} className="btn-interactive-success">Salva ricarica</button>
        </div>
      )}
    </>
  )
}