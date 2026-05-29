import type { FC } from 'react'

interface Props {
  userProfile: any
  setUserProfile: (p: any) => void
  customProvider: string
  setCustomProvider: (s: string) => void
  updateUserProfile: (p: any) => void
}

export const Profile: FC<Props> = ({ userProfile, setUserProfile, customProvider, setCustomProvider, updateUserProfile }) => {
  if (!userProfile) return null

  const providerOptions = [
    'Enel Energia', 'Eni Plenitude', 'A2A', 'Iren', 'E.On', 
    'Hera', 'Dolomiti Energia', 'Octopus Energy', 'Altro (scrivilo qui sotto)'
  ]

  // Stili locali condivisi per mantenere il codice pulito e a tema cyberpunk/dark
  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid #3f3f46',
    background: '#18181b',
    color: '#ffffff',
    outline: 'none',
    fontSize: '14px',
    marginTop: '4px',
    marginBottom: '14px',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#a1a1aa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px'
  }

  const subTextStyle = {
    fontSize: '11px',
    color: '#71717a',
    marginTop: '-8px',
    marginBottom: '14px',
    display: 'block',
    lineHeight: '1.4'
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '20px', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
        Configurazione Profilo & Tariffe
      </h2>
      
      {/* DATI UTENTE & VEICOLO */}
      <div>
        <label style={labelStyle}>Nome</label>
        <input type="text" value={userProfile.firstName} onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})} style={inputStyle} />
      </div>
      
      <div>
        <label style={labelStyle}>Cognome</label>
        <input type="text" value={userProfile.lastName} onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})} style={inputStyle} />
      </div>
      
      <div>
        <label style={labelStyle}>Modello auto</label>
        <input type="text" value={userProfile.carModel} onChange={(e) => setUserProfile({...userProfile, carModel: e.target.value})} style={inputStyle} />
      </div>
      
      <div>
        <label style={labelStyle}>Capacità batteria (kWh)</label>
        <input type="number" step="1" value={userProfile.batteryCapacity} onChange={(e) => setUserProfile({...userProfile, batteryCapacity: parseInt(e.target.value) || 0})} style={inputStyle} />
      </div>
      
      {/* GESTORE ENERGIA */}
      <div>
        <label style={labelStyle}>Gestore energia</label>
        <select 
          value={userProfile.energyProvider === customProvider && !providerOptions.includes(userProfile.energyProvider) ? 'Altro (scrivilo qui sotto)' : userProfile.energyProvider} 
          onChange={(e) => {
            if (e.target.value === 'Altro (scrivilo qui sotto)') {
              setUserProfile({...userProfile, energyProvider: customProvider || ''});
            } else {
              setUserProfile({...userProfile, energyProvider: e.target.value});
            }
          }} 
          style={inputStyle}
        >
          {providerOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {(!providerOptions.includes(userProfile.energyProvider) || userProfile.energyProvider === 'Altro (scrivilo qui sotto)') && (
        <div>
          <label style={labelStyle}>Scrivi il nome del gestore</label>
          <input 
            type="text" 
            value={customProvider} 
            onChange={(e) => {
              setCustomProvider(e.target.value);
              setUserProfile({...userProfile, energyProvider: e.target.value});
            }} 
            style={inputStyle} 
          />
        </div>
      )}

      {/* IMPOSTAZIONI ENERGIA AVANZATE */}
      <div style={{ marginTop: '10px', padding: '16px 0', borderTop: '1px solid rgba(63, 63, 70, 0.4)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          Configurazione Slot Tariffari
        </h3>
        
        <label style={labelStyle}>Tipo tariffa</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', marginBottom: '16px' }}>
          <button 
            onClick={() => setUserProfile({...userProfile, tariffType: 'monoraria'})} 
            style={{ 
              flex: 1, 
              padding: '11px', 
              borderRadius: '12px', 
              border: userProfile.tariffType === 'monoraria' ? '1px solid #3b82f6' : '1px solid #3f3f46', 
              background: userProfile.tariffType === 'monoraria' ? 'rgba(59, 130, 246, 0.15)' : '#18181b', 
              color: userProfile.tariffType === 'monoraria' ? '#3b82f6' : '#a1a1aa',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Monoraria
          </button>
          <button 
            onClick={() => setUserProfile({...userProfile, tariffType: 'fasce'})} 
            style={{ 
              flex: 1, 
              padding: '11px', 
              borderRadius: '12px', 
              border: userProfile.tariffType === 'fasce' ? '1px solid #3b82f6' : '1px solid #3f3f46', 
              background: userProfile.tariffType === 'fasce' ? 'rgba(59, 130, 246, 0.15)' : '#18181b', 
              color: userProfile.tariffType === 'fasce' ? '#3b82f6' : '#a1a1aa',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Fasce orarie
          </button>
        </div>

        {userProfile.tariffType === 'monoraria' ? (
          <div>
            <label style={labelStyle}>Quota variabile gestore (€/kWh)</label>
            <input type="number" step="0.001" value={userProfile.providerVariableRate || 0} onChange={(e) => setUserProfile({...userProfile, providerVariableRate: parseFloat(e.target.value) || 0})} style={inputStyle} />
            <small style={subTextStyle}>Trovi il costo variabile in bolletta come “spesa per vendita energia” diviso i kWh totali consumati.</small>
          </div>
        ) : (
          <div>
            <div>
              <label style={labelStyle}>Fascia F1 (08-19 feriali)</label>
              <input type="number" step="0.001" value={userProfile.fasce?.F1 || 0} onChange={(e) => setUserProfile({...userProfile, fasce: {...userProfile.fasce, F1: parseFloat(e.target.value) || 0}})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fascia F2 (07-08, 19-23 feriali • sab 07-23)</label>
              <input type="number" step="0.001" value={userProfile.fasce?.F2 || 0} onChange={(e) => setUserProfile({...userProfile, fasce: {...userProfile.fasce, F2: parseFloat(e.target.value) || 0}})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fascia F3 (23-07 dom e festivi)</label>
              <input type="number" step="0.001" value={userProfile.fasce?.F3 || 0} onChange={(e) => setUserProfile({...userProfile, fasce: {...userProfile.fasce, F3: parseFloat(e.target.value) || 0}})} style={inputStyle} />
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(63, 63, 70, 0.4)', paddingTop: '16px' }}>
        <label style={labelStyle}>Quota fissa mensile gestore (€/mese)</label>
        <input type="number" step="0.01" value={userProfile.providerFixedMonthlyFee || 0} onChange={(e) => setUserProfile({...userProfile, providerFixedMonthlyFee: parseFloat(e.target.value) || 0})} style={inputStyle} />
        <small style={subTextStyle}>Il “corrispettivo di commercializzazione” mensile fisso, che verrà ripartito in background sulle sessioni del mese.</small>
      </div>

      {/* PULSANTE DI SALVATAGGIO COMMIT PRIMARIO */}
      <button 
        onClick={() => updateUserProfile(userProfile)} 
        style={{ 
          width: '100%', 
          padding: '14px', 
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
          border: 'none', 
          color: '#ffffff', 
          borderRadius: '12px', 
          fontSize: '14px', 
          fontWeight: '700', 
          cursor: 'pointer', 
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
          marginTop: '10px'
        }}
      >
        Salva configurazione profilo
      </button>
    </div>
  )
}