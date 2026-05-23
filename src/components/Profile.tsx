import React from 'react'
import { styles, colors } from '../styles/styles'
import type { ChargingSession } from '../types'

interface Props {
  userProfile: any
  setUserProfile: (p: any) => void
  customProvider: string
  setCustomProvider: (s: string) => void
  updateUserProfile: (p: any) => void
}

export const Profile: React.FC<Props> = ({ userProfile, setUserProfile, customProvider, setCustomProvider, updateUserProfile }) => {
  if (!userProfile) return null
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Il mio profilo</h2>
      <div><label style={styles.label}>Nome</label><input type="text" value={userProfile.firstName} onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})} style={styles.input} /></div>
      <div><label style={styles.label}>Cognome</label><input type="text" value={userProfile.lastName} onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})} style={styles.input} /></div>
      <div><label style={styles.label}>Modello auto</label><input type="text" value={userProfile.carModel} onChange={(e) => setUserProfile({...userProfile, carModel: e.target.value})} style={styles.input} /></div>
      <div><label style={styles.label}>Capacità batteria (kWh)</label><input type="number" step="1" value={userProfile.batteryCapacity} onChange={(e) => setUserProfile({...userProfile, batteryCapacity: parseInt(e.target.value)})} style={styles.input} /></div>
      
      <div><label style={styles.label}>Gestore energia</label>
        <select value={userProfile.energyProvider === customProvider && !['Enel Energia','Eni Plenitude','A2A','Iren','E.On','Hera','Dolomiti Energia','Octopus Energy','Altro (scrivilo qui sotto)'].includes(userProfile.energyProvider) ? 'Altro (scrivilo qui sotto)' : userProfile.energyProvider} onChange={(e) => {
          if (e.target.value === 'Altro (scrivilo qui sotto)') {
            setUserProfile({...userProfile, energyProvider: customProvider || ''});
          } else {
            setUserProfile({...userProfile, energyProvider: e.target.value});
          }
        }} style={styles.input}>
          {['Enel Energia','Eni Plenitude','A2A','Iren','E.On','Hera','Dolomiti Energia','Octopus Energy','Altro (scrivilo qui sotto)'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {(!['Enel Energia','Eni Plenitude','A2A','Iren','E.On','Hera','Dolomiti Energia','Octopus Energy','Altro (scrivilo qui sotto)'].includes(userProfile.energyProvider) || userProfile.energyProvider === 'Altro (scrivilo qui sotto)') && (
        <div><label style={styles.label}>Scrivi il nome del gestore</label>
          <input type="text" value={customProvider} onChange={(e) => {
            setCustomProvider(e.target.value);
            setUserProfile({...userProfile, energyProvider: e.target.value});
          }} style={styles.input} />
        </div>
      )}

      <div style={{ marginTop: '18px' }}>
        <h3 style={{ margin: '8px 0', fontSize: '16px' }}>Impostazioni energia</h3>
        <label style={styles.label}>Tipo tariffa</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button onClick={() => setUserProfile({...userProfile, tariffType: 'monoraria'})} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: (userProfile.tariffType === 'monoraria') ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: 'white', cursor: 'pointer' }}>Monoraria</button>
          <button onClick={() => setUserProfile({...userProfile, tariffType: 'fasce'})} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: (userProfile.tariffType === 'fasce') ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: 'white', cursor: 'pointer' }}>Fasce orarie</button>
        </div>

        {userProfile.tariffType === 'monoraria' ? (
          <div style={{ marginBottom: '10px' }}>
            <label style={styles.label}>Quota variabile gestore (€/kWh)</label>
            <input type="number" step="0.001" value={userProfile.providerVariableRate || 0} onChange={(e) => setUserProfile({...userProfile, providerVariableRate: parseFloat(e.target.value)})} style={styles.input} />
            <label style={{ fontSize: '12px', color: '#6b6b6b', marginTop: '6px' }}>Trovi il costo variabile in bolletta come “spesa per vendita energia” diviso kWh consumati.</label>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '8px' }}>
              <label style={styles.label}>Fascia F1 (08-19 feriali)</label>
              <input type="number" step="0.01" value={userProfile.fasce?.F1 || 0} onChange={(e) => setUserProfile({...userProfile, fasce: {...userProfile.fasce, F1: parseFloat(e.target.value)}})} style={styles.input} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={styles.label}>Fascia F2 (07-08,19-23 feriali, sab 07-23)</label>
              <input type="number" step="0.01" value={userProfile.fasce?.F2 || 0} onChange={(e) => setUserProfile({...userProfile, fasce: {...userProfile.fasce, F2: parseFloat(e.target.value)}})} style={styles.input} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={styles.label}>Fascia F3 (23-07, dom e festivi)</label>
              <input type="number" step="0.01" value={userProfile.fasce?.F3 || 0} onChange={(e) => setUserProfile({...userProfile, fasce: {...userProfile.fasce, F3: parseFloat(e.target.value)}})} style={styles.input} />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px' }}>
        <label style={styles.label}>Quota fissa mensile gestore (€/mese)</label>
        <input type="number" step="0.01" value={userProfile.providerFixedMonthlyFee || 0} onChange={(e) => setUserProfile({...userProfile, providerFixedMonthlyFee: parseFloat(e.target.value)})} style={styles.input} />
        <label style={{ fontSize: '12px', color: '#6b6b6b', marginTop: '6px' }}>La quota fissa è il “corrispettivo di commercializzazione” mensile che verrà ripartito sulle ricariche del mese.</label>
      </div>

      <button onClick={() => updateUserProfile(userProfile)} style={styles.buttonPrimary}>Salva profilo</button>
    </div>
  )
}
