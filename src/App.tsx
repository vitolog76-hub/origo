import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Planner } from './components/Planner'
import { History } from './components/History'
import { Profile } from './components/Profile'

// --------------------------------------------------------------
// TIPI
// --------------------------------------------------------------
import type { ChargingSession, CalculationResult } from './types'

interface UserProfile {
  firstName: string;
  lastName: string;
  carModel: string;
  batteryCapacity: number;
  energyProvider: string;
  providerVariableRate?: number;
  providerFixedMonthlyFee?: number;
  tariffType?: 'monoraria' | 'fasce';
  fasce?: { F1: number; F2: number; F3: number };
}

// --------------------------------------------------------------
// LISTE
// --------------------------------------------------------------
const ENERGY_PROVIDERS = [
  'Enel Energia',
  'Eni Plenitude',
  'A2A',
  'Iren',
  'E.On',
  'Hera',
  'Dolomiti Energia',
  'Octopus Energy',
  'Altro (scrivilo qui sotto)'
];

// --------------------------------------------------------------
// COMPONENTE PRINCIPALE
// --------------------------------------------------------------
function App() {
  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [customProvider, setCustomProvider] = useState('');

  // Dati ricarica
  const [socInitial, setSocInitial] = useState(20);
  const [socFinal, setSocFinal] = useState(100);
  const [targetTime, setTargetTime] = useState('08:00');
  const [chargingPower, setChargingPower] = useState(7);
  const [batteryCapacity, setBatteryCapacity] = useState(50);
  const [locationType, setLocationType] = useState<'home' | 'public'>('home');
  const [operatorCost, setOperatorCost] = useState(0.45);
  const [chargings, setChargings] = useState<ChargingSession[]>([]);
  const [result, setResult] = useState<any>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingCharge, setEditingCharge] = useState<ChargingSession | null>(null);
  const [editingSocInitial, setEditingSocInitial] = useState(0);
  const [editingSocFinal, setEditingSocFinal] = useState(0);
  const [editingChargingPower, setEditingChargingPower] = useState(0);
  const [activeTab, setActiveTab] = useState<'planner' | 'history' | 'profile'>('planner');
  const [exportStartDate, setExportStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [exportEndDate, setExportEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Costi energia are stored in user profile now

  // ------------------------------------------------------------
  // AUTENTICAZIONE + PROFILO + RICARICHE
  // ------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.uid);
        loadUserChargings(currentUser.uid);
      } else {
        setUserProfile(null);
        setChargings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      setUserProfile(data);
      setBatteryCapacity(data.batteryCapacity || 50);
      setCustomProvider(!ENERGY_PROVIDERS.includes(data.energyProvider) ? data.energyProvider : '');
    } else {
      const newProfile: UserProfile = {
        firstName: '',
        lastName: '',
        carModel: '',
        batteryCapacity: 50,
        energyProvider: 'Enel Energia',
        providerVariableRate: 0,
        providerFixedMonthlyFee: 0,
        tariffType: 'monoraria',
        fasce: { F1: 0, F2: 0, F3: 0 }
      };
      await setDoc(docRef, newProfile);
      setUserProfile(newProfile);
    }
  };

  const updateUserProfile = async (profile: UserProfile) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
    setBatteryCapacity(profile.batteryCapacity);
    alert('Profilo aggiornato');
  };

  const loadUserChargings = (userId: string) => {
    const q = query(
      collection(db, 'chargings'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const data: ChargingSession[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as ChargingSession);
      });
      setChargings(data);
    });
  };

  const handleEmailAuth = async () => {
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ------------------------------------------------------------
  // CALCOLI RICARICA
  // ------------------------------------------------------------
  const calculateCharging = () => {
    const percentageNeeded = socFinal - socInitial;
    const kwhNeeded = (percentageNeeded / 100) * batteryCapacity;
    const durationHours = kwhNeeded / chargingPower;
    const [targetHour, targetMinute] = targetTime.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetHour, targetMinute, 0, 0);
    const startDate = new Date(targetDate.getTime() - durationHours * 60 * 60 * 1000);
    const startTime = startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setResult({ startTime, endTime: targetTime, kwhNeeded, duration: durationHours });
  };

  const getEnergyCost = (): number => {
    if (!userProfile) return 0;
    if (userProfile.tariffType === 'fasce') {
      const hour = parseInt(targetTime.split(':')[0]);
      const fasce = userProfile.fasce || { F1: 0, F2: 0, F3: 0 };
      if (hour >= 8 && hour < 19) return fasce.F1 || 0;
      if (hour >= 19 && hour < 23) return fasce.F2 || 0;
      return fasce.F3 || 0;
    }
    return userProfile.providerVariableRate || 0;
  };

  const calculateCost = (kwh: number, type: 'home' | 'public'): number => {
    if (type === 'public') return kwh * operatorCost;
    return kwh * getEnergyCost();
  };

  const saveCharging = async () => {
    if (!result || !user) return;

    try {
      // base values
      const dateStr = new Date().toISOString().split('T')[0];
      const kwh = result.kwhNeeded;
      const energyRate = getEnergyCost();
      const energyCostValue = kwh * energyRate;
      const providerFixedMonthlyFee = userProfile?.providerFixedMonthlyFee || 0;
      const providerVariableRate = userProfile?.providerVariableRate || 0;

      // create new session with partial costs (fixed portion will be computed in batch)
      const newSession = {
        date: dateStr,
        startTime: result.startTime,
        endTime: result.endTime,
        socInitial,
        socFinal,
        kwhCharged: kwh,
        chargingPower,
        areraCost: energyCostValue,
        providerVariableCost: 0,
        providerFixedPortion: 0,
        totalCost: energyCostValue,
        locationType,
        energyCost: energyRate,
        energyProvider: userProfile?.energyProvider || 'Non specificato',
        userId: user.uid,
        createdAt: Timestamp.now()
      } as any;

      // add new doc first so it is included in month query
      await addDoc(collection(db, 'chargings'), newSession);

      // determine month window for this date
      const d = new Date(dateStr);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      // fetch all chargings for this user in the same month
      const q = query(
        collection(db, 'chargings'),
        where('userId', '==', user.uid),
        where('date', '>=', monthStart),
        where('date', '<=', monthEnd)
      );
      const snap = await getDocs(q);

      const monthTotalKwh = snap.docs.reduce((s, ds) => s + (ds.data().kwhCharged || 0), 0);

      // batch update providerFixedPortion and totalCost for all docs in the month
      const batch = writeBatch(db);
      snap.forEach(ds => {
        const data: any = ds.data();
        const k = data.kwhCharged || 0;
        const fixedPortion = monthTotalKwh > 0 ? (k / monthTotalKwh) * providerFixedMonthlyFee : 0;
        const areraC = typeof data.areraCost === 'number' ? data.areraCost : (k * (data.energyCost ?? areraPrice));
        const providerVarC = typeof data.providerVariableCost === 'number' ? data.providerVariableCost : (k * providerVariableRate);
        const newTotal = areraC + providerVarC + fixedPortion;
        batch.update(doc(db, 'chargings', ds.id), {
          providerFixedPortion: fixedPortion,
          areraCost: areraC,
          providerVariableCost: providerVarC,
          totalCost: newTotal
        });
      });
      await batch.commit();

      setSaveMessage('Ricarica salvata con successo');
      setSaveError(null);
      setResult(null);
      window.setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      console.error('Errore salvataggio ricarica:', err);
      setSaveMessage(null);
      setSaveError(err.message || 'Errore durante il salvataggio');
    }
  };

  const deleteCharging = async (id: string) => {
    await deleteDoc(doc(db, 'chargings', id));
  };

  const startEditingCharging = (charge: ChargingSession) => {
    setEditingCharge(charge);
    setEditingSocInitial(charge.socInitial);
    setEditingSocFinal(charge.socFinal);
    setEditingChargingPower(charge.chargingPower);
  };

  const cancelEditingCharging = () => {
    setEditingCharge(null);
  };

  const saveChargingEdit = async () => {
    if (!editingCharge) return;
    const capacity = userProfile?.batteryCapacity || batteryCapacity;
    const percentage = editingSocFinal - editingSocInitial;
    const newKwhCharged = Math.max(0, (percentage / 100) * capacity);
    const costPerKwh = editingCharge.kwhCharged > 0 ? editingCharge.totalCost / editingCharge.kwhCharged : editingCharge.energyCost;
    const newTotalCost = newKwhCharged * costPerKwh;

    await updateDoc(doc(db, 'chargings', editingCharge.id), {
      socInitial: editingSocInitial,
      socFinal: editingSocFinal,
      chargingPower: editingChargingPower,
      kwhCharged: newKwhCharged,
      totalCost: newTotalCost
    });

    setEditingCharge(null);
  };

  // ------------------------------------------------------------
  // PULISCI DUPLICATI (stessa data, startTime, kwhCharged)
  // ------------------------------------------------------------
  const cleanDuplicates = async () => {
    if (!user) return;
    const confirmed = window.confirm('⚠️ Questa operazione rimuoverà i record duplicati (stessa data, orario, kWh). Continuare?');
    if (!confirmed) return;

    const q = query(collection(db, 'chargings'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const bestMap = new Map<string, { id: string; createdAt: Timestamp }>();
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const key = `${data.date}|${data.startTime}|${data.kwhCharged}`;
      const existing = bestMap.get(key);
      if (!existing || (data.createdAt && data.createdAt.seconds > existing.createdAt.seconds)) {
        bestMap.set(key, { id: docSnap.id, createdAt: data.createdAt });
      }
    });
    const toDelete: string[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const key = `${data.date}|${data.startTime}|${data.kwhCharged}`;
      const best = bestMap.get(key);
      if (best && best.id !== docSnap.id) {
        toDelete.push(docSnap.id);
      }
    });
    for (const id of toDelete) {
      await deleteDoc(doc(db, 'chargings', id));
    }
    alert(`Rimossi ${toDelete.length} record duplicati.`);
  };

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // Energy settings are stored/edited in user profile
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // ESPORTAZIONE PDF (intervallo date)
  // ------------------------------------------------------------
  const exportToPDF = () => {
    if (!userProfile) return;
    const doc = new jsPDF();

    const filteredChargings = chargings.filter(c => {
      const date = new Date(c.date);
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });

    const totalKwh = filteredChargings.reduce((s, c) => s + c.kwhCharged, 0);
    const totalCost = filteredChargings.reduce((s, c) => s + c.totalCost, 0);
    const totalArera = filteredChargings.reduce((s, c) => s + (c.areraCost || (c.kwhCharged * c.energyCost)), 0);
    const totalProviderVar = filteredChargings.reduce((s, c) => s + (c.providerVariableCost || 0), 0);
    const totalProviderFixed = filteredChargings.reduce((s, c) => s + (c.providerFixedPortion || 0), 0);

    doc.setFontSize(18);
    doc.text('OriGo - Report Ricariche', 14, 20);
    doc.setFontSize(12);
    doc.text(`Utente: ${userProfile.firstName} ${userProfile.lastName}`, 14, 35);
    doc.text(`Auto: ${userProfile.carModel} (${userProfile.batteryCapacity} kWh)`, 14, 45);
    doc.text(`Gestore energia: ${userProfile.energyProvider}`, 14, 55);
    doc.text(`Periodo: dal ${exportStartDate} al ${exportEndDate}`, 14, 65);
    doc.text(`Totale kWh: ${totalKwh.toFixed(2)} kWh`, 14, 75);
    doc.text(`Totale costo: € ${totalCost.toFixed(2)}`, 14, 85);

    // summary breakdown
    doc.setFontSize(12);
    doc.text(`Dettaglio costi: ARERA € ${filteredChargings.length ? filteredChargings[0].energyCost.toFixed(3) : getEnergyCost().toFixed(3)} €/kWh (applicato per ricarica)`, 14, 95);
    doc.text(`Totale ARERA: € ${totalArera.toFixed(2)}  —  Gestore variabile: € ${totalProviderVar.toFixed(2)}  —  Quota fissa ripartita: € ${totalProviderFixed.toFixed(2)}`, 14, 102);

    const tableData = filteredChargings.map(c => [
      c.date,
      `${c.startTime} → ${c.endTime}`,
      `${c.kwhCharged.toFixed(1)} kWh`,
      `€ ${ (c.areraCost ?? (c.kwhCharged * c.energyCost)).toFixed(2) }`,
      `€ ${ (c.providerVariableCost ?? 0).toFixed(2) }`,
      `€ ${ (c.providerFixedPortion ?? 0).toFixed(2) }`,
      `€ ${c.totalCost.toFixed(2)}`,
      c.locationType === 'home' ? 'Home' : 'Pubblica',
      c.energyProvider,
      `€ ${c.energyCost.toFixed(3)}/kWh`
    ]);

    autoTable(doc, {
      startY: 112,
      head: [['Data', 'Orario', 'kWh', 'ARERA', 'Gestore var.', 'Quota fissa', 'Totale', 'Luogo', 'Gestore', 'Costo kWh']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 122, 255] }
    });

    doc.save(`ricariche_${exportStartDate}_${exportEndDate}.pdf`);
  };

  // ------------------------------------------------------------
  // STATISTICHE E UTILITY
  // ------------------------------------------------------------
  const totalKwh = chargings.reduce((s, c) => s + c.kwhCharged, 0);
  const totalCost = chargings.reduce((s, c) => s + c.totalCost, 0);

  const adjustPower = (delta: number) => {
    let newValue = chargingPower + delta;
    if (newValue < 1) newValue = 1;
    if (newValue > 50) newValue = 50;
    setChargingPower(parseFloat(newValue.toFixed(1)));
  };

  const currentYear = new Date().getFullYear();
  const monthlyData = [];
  for (let m = 0; m < 12; m++) {
    const monthChargings = chargings.filter(c => {
      const date = new Date(c.date);
      return date.getMonth() === m && date.getFullYear() === currentYear;
    });
    monthlyData.push({
      month: m,
      kwh: monthChargings.reduce((s, c) => s + c.kwhCharged, 0),
      cost: monthChargings.reduce((s, c) => s + c.totalCost, 0)
    });
  }
  const maxKwh = Math.max(...monthlyData.map(d => d.kwh), 1);
  const maxCost = Math.max(...monthlyData.map(d => d.cost), 1);
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  const groupedHistory = Object.values(chargings.reduce((acc, c) => {
    const date = new Date(c.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;
    if (!acc[key]) {
      acc[key] = { year, month, charges: [] as ChargingSession[], totalKwh: 0, totalCost: 0 };
    }
    acc[key].charges.push(c);
    acc[key].totalKwh += c.kwhCharged;
    acc[key].totalCost += c.totalCost;
    return acc;
  }, {} as Record<string, { year: number; month: number; charges: ChargingSession[]; totalKwh: number; totalCost: number; }>)).sort((a, b) => b.year - a.year || b.month - a.month);

  // ------------------------------------------------------------
  // STILI
  // ------------------------------------------------------------
  const styles = {
    container: { minHeight: '100vh', background: 'rgba(255,255,255,0.45)', padding: '32px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)' },
    card: { background: 'rgba(255,255,255,0.72)', borderRadius: '28px', padding: '24px', boxShadow: '0 28px 90px rgba(88, 99, 234, 0.14)', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)' },
    buttonPrimary: { background: '#4f46e5', border: 'none', padding: '14px', borderRadius: '16px', color: 'white', fontWeight: '600', fontSize: '16px', cursor: 'pointer', width: '100%' },
    buttonSuccess: { background: '#10b981', border: 'none', padding: '14px', borderRadius: '16px', color: 'white', fontWeight: '600', fontSize: '16px', cursor: 'pointer', width: '100%' },
    input: { width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid rgba(156, 163, 175, 0.3)', fontSize: '16px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.9)' },
    label: { display: 'block', marginBottom: '10px', color: '#303043', fontWeight: '600', fontSize: '14px' },
    title: { fontSize: '24px', fontWeight: '700', color: '#18181b', marginBottom: '18px' },
    slider: { width: '100%', height: '6px', background: 'rgba(79, 70, 229, 0.16)', WebkitAppearance: 'none' as const },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
    tab: { flex: 1, padding: '12px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.55)', fontWeight: '700', fontSize: '15px', cursor: 'pointer', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' }
  };

  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '60px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: '700', textAlign: 'center', marginBottom: '32px' }}>OriGo Charge</h1>
          <div style={styles.card}>
            <h2 style={styles.title}>{isLogin ? 'Accedi' : 'Registrati'}</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
            </div>
            {error && <div style={{ color: '#ff3b30', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
            <button onClick={handleEmailAuth} style={styles.buttonPrimary}>{isLogin ? 'Accedi' : 'Registrati'}</button>
            <button onClick={handleGoogleLogin} style={{ ...styles.buttonPrimary, background: '#4285F4', marginTop: '12px' }}>Accedi con Google</button>
            <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#007aff', marginTop: '16px', cursor: 'pointer' }}>
              {isLogin ? 'Crea un account' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // APP PRINCIPALE (DOPO LOGIN)
  // ------------------------------------------------------------
  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: '700', margin: 0 }}>OriGo Charge</h1>
          <button onClick={handleLogout} style={{ background: '#ff3b30', border: 'none', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: '500', cursor: 'pointer' }}>Esci</button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.68)', padding: '6px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.45)', backdropFilter: 'blur(14px)' }}>
          <button onClick={() => setActiveTab('planner')} style={{ ...styles.tab, background: activeTab === 'planner' ? '#ffffff' : 'transparent', color: activeTab === 'planner' ? '#007aff' : '#8e8e93' }}>Planner</button>
          <button onClick={() => setActiveTab('history')} style={{ ...styles.tab, background: activeTab === 'history' ? '#ffffff' : 'transparent', color: activeTab === 'history' ? '#007aff' : '#8e8e93' }}>Storico</button>
          <button onClick={() => setActiveTab('profile')} style={{ ...styles.tab, background: activeTab === 'profile' ? '#ffffff' : 'transparent', color: activeTab === 'profile' ? '#007aff' : '#8e8e93' }}>Profilo</button>
        </div>

        {/* TAB PROFILO */}
        {activeTab === 'profile' && (
          <Profile userProfile={userProfile} setUserProfile={setUserProfile} customProvider={customProvider} setCustomProvider={setCustomProvider} updateUserProfile={updateUserProfile} />
        )}

        {/* TAB ENERGIA removed: energy settings now managed elsewhere (kept in state) */}

        {/* TAB PLANNER */}
        {activeTab === 'planner' && (
          <Planner
            socInitial={socInitial}
            setSocInitial={setSocInitial}
            socFinal={socFinal}
            setSocFinal={setSocFinal}
            targetTime={targetTime}
            setTargetTime={setTargetTime}
            chargingPower={chargingPower}
            setChargingPower={setChargingPower}
            batteryCapacity={batteryCapacity}
            setBatteryCapacity={setBatteryCapacity}
            locationType={locationType}
            setLocationType={setLocationType}
            operatorCost={operatorCost}
            setOperatorCost={setOperatorCost}
            result={result}
            onCalculate={calculateCharging}
            onSave={saveCharging}
            getEnergyCost={getEnergyCost}
            calculateCost={() => result ? calculateCost(result.kwhNeeded, locationType) : 0}
            saveMessage={saveMessage}
            saveError={saveError}
          />
        )}

        {/* TAB STORICO + ESPORTAZIONE PDF + PULSANTE PULISCI DUPLICATI */}
        {activeTab === 'history' && (
          <>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={styles.title}>Statistiche mensili {currentYear}</h2>
              </div>
              <div><div style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>kWh per mese</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100px' }}>
                  {monthlyData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${(d.kwh / maxKwh) * 80}px`, background: '#007aff', borderRadius: '4px 4px 0 0' }} />
                      <div style={{ fontSize: '9px', marginTop: '4px', color: '#8e8e93' }}>{months[i]}</div>
                      <div style={{ fontSize: '10px', fontWeight: '600' }}>{d.kwh.toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div><div style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>Costo per mese (€)</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100px' }}>
                  {monthlyData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${(d.cost / maxCost) * 80}px`, background: '#34c759', borderRadius: '4px 4px 0 0' }} />
                      <div style={{ fontSize: '9px', marginTop: '4px', color: '#8e8e93' }}>{months[i]}</div>
                      <div style={{ fontSize: '10px', fontWeight: '600' }}>{d.cost.toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={styles.title}>Cronologia ricariche</h2>
                <button
                  onClick={cleanDuplicates}
                  style={{ background: '#ff9500', border: 'none', padding: '8px 12px', borderRadius: '12px', color: 'white', fontWeight: '500', cursor: 'pointer' }}
                >
                  Pulisci duplicati
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.75)', borderRadius: '22px', padding: '18px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(18px)' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700' }}>{totalKwh.toFixed(0)}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>kWh totali</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.75)', borderRadius: '22px', padding: '18px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(18px)' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{totalCost.toFixed(2)} €</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Costo totale</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.75)', borderRadius: '22px', padding: '18px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(18px)' }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#4f46e5' }}>{chargings.length}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Ricariche</div>
                </div>
              </div>

              {/* Esportazione PDF */}
              <div style={{ marginBottom: '20px', padding: '18px', background: '#eef2ff', borderRadius: '20px' }}>
                <label style={styles.label}>Esporta PDF per periodo</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#666' }}>Da data</label>
                    <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} style={styles.input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#666' }}>A data</label>
                    <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} style={styles.input} />
                  </div>
                  <button onClick={exportToPDF} style={{ background: '#007aff', border: 'none', padding: '12px', borderRadius: '12px', color: 'white', fontWeight: '600', cursor: 'pointer', marginTop: '22px' }}>📄 Esporta PDF</button>
                </div>
              </div>

              {/* Modifica ricarica (se attiva) */}
              {editingCharge && (
                <div style={{ marginBottom: '20px', padding: '18px', background: '#f8fafc', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700' }}>Modifica ricarica</div>
                      <div style={{ fontSize: '12px', color: '#8e8e93' }}>{editingCharge.date} • {editingCharge.startTime} → {editingCharge.endTime}</div>
                    </div>
                    <button onClick={cancelEditingCharging} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#ff3b30' }}>×</button>
                  </div>

                  <div style={styles.grid2}>
                    <div>
                      <label style={styles.label}>SOC Iniziale • {editingSocInitial}%</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <button onClick={() => setEditingSocInitial((value) => Math.max(0, value - 1))} style={{ width: '44px', height: '44px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.8)', fontSize: '24px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)' }}>-</button>
                        <input type="number" min="0" max="99" value={editingSocInitial} onChange={(e) => setEditingSocInitial(Math.min(99, Math.max(0, Number(e.target.value))))} style={{ ...styles.input, margin: 0, flex: 1, textAlign: 'center' }} />
                        <button onClick={() => setEditingSocInitial((value) => Math.min(99, value + 1))} style={{ width: '44px', height: '44px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.8)', fontSize: '24px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)' }}>+</button>
                      </div>
                      <input type="range" min="0" max="99" value={editingSocInitial} onChange={(e) => setEditingSocInitial(Number(e.target.value))} style={styles.slider} />
                    </div>
                    <div>
                      <label style={styles.label}>SOC Finale • {editingSocFinal}%</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <button onClick={() => setEditingSocFinal((value) => Math.max(1, value - 1))} style={{ width: '44px', height: '44px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.8)', fontSize: '24px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)' }}>-</button>
                        <input type="number" min="1" max="100" value={editingSocFinal} onChange={(e) => setEditingSocFinal(Math.min(100, Math.max(1, Number(e.target.value))))} style={{ ...styles.input, margin: 0, flex: 1, textAlign: 'center' }} />
                        <button onClick={() => setEditingSocFinal((value) => Math.min(100, value + 1))} style={{ width: '44px', height: '44px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.8)', fontSize: '24px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)' }}>+</button>
                      </div>
                      <input type="range" min="1" max="100" value={editingSocFinal} onChange={(e) => setEditingSocFinal(Number(e.target.value))} style={styles.slider} />
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={styles.label}>Potenza ricarica</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button onClick={() => setEditingChargingPower((value) => Math.max(1, value - 0.5))} style={{ width: '44px', height: '44px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.8)', fontSize: '24px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)' }}>-</button>
                      <input type="number" min="1" max="50" step="0.5" value={editingChargingPower} onChange={(e) => setEditingChargingPower(Math.min(50, Math.max(1, parseFloat(e.target.value || '1'))))} style={{ ...styles.input, flex: 1, margin: 0, textAlign: 'center' }} />
                      <button onClick={() => setEditingChargingPower((value) => Math.min(50, value + 0.5))} style={{ width: '44px', height: '44px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.8)', fontSize: '24px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)' }}>+</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button onClick={saveChargingEdit} style={{ ...styles.buttonSuccess, flex: 1 }}>Salva modifiche</button>
                    <button onClick={cancelEditingCharging} style={{ ...styles.buttonPrimary, background: '#8e8e93', flex: 1 }}>Annulla</button>
                  </div>
                </div>
              )}

              {/* Lista delle ricariche (component)} */}
              <div>
                <History chargings={chargings} onDelete={deleteCharging} onEdit={startEditingCharging} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;