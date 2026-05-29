import { useState, useEffect } from 'react';
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
import { Planner } from './components/Planner';
import { History } from './components/History';
import { Profile } from './components/Profile';
import type { ChargingSession } from './types';

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
    await updateDoc(doc(db, 'users', user.uid), { ...profile });
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
      const dateStr = new Date().toISOString().split('T')[0];
      const kwh = result.kwhNeeded;
      const energyRate = getEnergyCost();
      const energyCostValue = kwh * energyRate;
      const providerFixedMonthlyFee = userProfile?.providerFixedMonthlyFee || 0;
      const providerVariableRate = userProfile?.providerVariableRate || 0;

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

      await addDoc(collection(db, 'chargings'), newSession);

      const d = new Date(dateStr);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      const q = query(
        collection(db, 'chargings'),
        where('userId', '==', user.uid),
        where('date', '>=', monthStart),
        where('date', '<=', monthEnd)
      );
      const snap = await getDocs(q);

      const monthTotalKwh = snap.docs.reduce((s, ds) => s + (ds.data().kwhCharged || 0), 0);

      const batch = writeBatch(db);
      snap.forEach(ds => {
        const data: any = ds.data();
        const k = data.kwhCharged || 0;
        const fixedPortion = monthTotalKwh > 0 ? (k / monthTotalKwh) * providerFixedMonthlyFee : 0;
        const areraC = typeof data.areraCost === 'number' ? data.areraCost : (k * (data.energyCost ?? 0));
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
      c.energyProvider ?? '',
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

  const totalKwh = chargings.reduce((s, c) => s + c.kwhCharged, 0);
  const totalCost = chargings.reduce((s, c) => s + c.totalCost, 0);

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

  // RESTYLING COMPLETO TECH / CYBERPUNK (Dark Mode, Glow ed EV-Style)
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'transparent', // SBLOCCATO: Diventa trasparente per far passare i cerchi globali!
      padding: '16px',
      fontFamily: 'Orbitron, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#f4f4f5',
      boxSizing: 'border-box' as const,
      position: 'relative' as const,
      zIndex: 1
    },
    card: {
      background: 'rgba(20, 20, 25, 0.7)', // Pannello semi-trasparente scuro
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(63, 63, 70, 0.4)', // Bordo tech sottile
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      marginBottom: '16px'
    },
    buttonPrimary: {
      background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.22), rgba(15, 23, 42, 0.95))',
      border: '1px solid rgba(255,255,255,0.12)',
      padding: '14px',
      borderRadius: '16px',
      color: '#ffffff',
      fontWeight: '600' as const,
      fontSize: '14px',
      cursor: 'pointer',
      width: '100%',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(59, 130, 246, 0.18)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    },
    buttonSuccess: {
      background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.22), rgba(6, 78, 50, 0.95))',
      border: '1px solid rgba(255,255,255,0.12)',
      padding: '14px',
      borderRadius: '16px',
      color: '#ffffff',
      fontWeight: '600' as const,
      fontSize: '14px',
      cursor: 'pointer',
      width: '100%',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(16, 185, 129, 0.18)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      border: '1px solid #3f3f46',
      fontSize: '14px',
      boxSizing: 'border-box' as const,
      background: '#18181b',
      color: '#ffffff',
      outline: 'none'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      color: '#a1a1aa', 
      fontWeight: '600' as const,
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px'
    },
    title: {
      fontSize: '18px',
      fontWeight: '700' as const,
      color: '#ffffff',
      marginBottom: '16px',
      letterSpacing: '-0.3px'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px'
    },
    tab: {
      flex: 1,
      padding: '10px',
      borderRadius: '30px',
      border: 'none',
      fontWeight: '600' as const,
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  };

  if (!user) {
    return (
      <div style={styles.container}>
        {/* Sfondo atomico globale iniettato per la schermata di login */}
        <style>{`
          body, html, #root {
            background-color: #07040d !important;
            background-image: 
              radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 85% 75%, rgba(16, 185, 129, 0.15) 0%, transparent 45%) !important;
            background-attachment: fixed;
          }
        `}</style>
        <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '60px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', letterSpacing: '-1px', color: '#fff' }}>
            OriGo <span style={{ color: '#3b82f6', textShadow: '0 0 15px rgba(59,130,246,0.5)' }}>Charge</span>
          </h1>
          <p style={{ textAlign: 'center', color: '#71717a', fontSize: '14px', marginBottom: '32px' }}>EV Smart Energy Management Platform</p>
          <div style={styles.card}>
            <h2 style={{ ...styles.title, textAlign: 'center', fontSize: '20px' }}>SYSTEM AUTHENTICATION</h2>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '14px', textAlign: 'center', fontWeight: '500' }}>{error}</div>}
            <button onClick={handleEmailAuth} className="tech-button" style={styles.buttonPrimary}>{isLogin ? 'Login' : 'Register'}</button>
            <button onClick={handleGoogleLogin} className="tech-button" style={{ ...styles.buttonPrimary, background: 'rgba(255, 255, 255, 0.14)', color: '#f4f4f5', marginTop: '10px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(255,255,255,0.12)' }}>Continue with Google</button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                {isLogin ? "Don't have an account? Sign up" : 'Already verified? Log in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* INIEZIONE FORZATA DELLO SFONDO GLOBALE + ELEMENTI DI RESET TRASPARENZA */}
      <style>{`
        body, html, #root {
          background-color: #06040a !important;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.35) 0%, transparent 50%),
            radial-gradient(circle at 90% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 25% 80%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(37, 99, 235, 0.15) 0%, transparent 40%) !important;
          background-attachment: fixed !important;
          background-size: cover !important;
        }
      `}</style>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            OriGo <span style={{ color: '#3b82f6' }}>⚡</span>
          </h1>
          <button onClick={handleLogout} className="tech-button secondary" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.32)', color: '#ef4444', padding: '8px 16px', borderRadius: '18px', fontSize: '11px', letterSpacing: '0.12em' }}>Log Out</button>
        </div>

        {/* TABS CON TRASPARENZA ULTRA LEGGERA ED EFFETTO VETRO (GLASSMORPHISM) */}
<div style={{ 
  display: 'flex', 
  gap: '4px', 
  marginBottom: '20px', 
  background: 'rgba(255, 255, 255, 0.03)', // Trasparenza quasi totale (addio nero pesante)
  padding: '4px', 
  borderRadius: '30px', 
  border: '1px solid rgba(255, 255, 255, 0.08)', // Bordino tech ultra sottile e luminoso
  backdropFilter: 'blur(16px)', // Raddoppiata la sfocatura per un effetto vetro premium
  WebkitBackdropFilter: 'blur(16px)' 
}}>
  <button onClick={() => setActiveTab('planner')} style={{ ...styles.tab, background: activeTab === 'planner' ? '#2563eb' : 'transparent', color: activeTab === 'planner' ? '#ffffff' : '#a1a1aa' }}>PLANNER</button>
  <button onClick={() => setActiveTab('history')} style={{ ...styles.tab, background: activeTab === 'history' ? '#2563eb' : 'transparent', color: activeTab === 'history' ? '#ffffff' : '#a1a1aa' }}>DASHBOARD</button>
  <button onClick={() => setActiveTab('profile')} style={{ ...styles.tab, background: activeTab === 'profile' ? '#2563eb' : 'transparent', color: activeTab === 'profile' ? '#ffffff' : '#a1a1aa' }}>VEHICLE & TARIFF</button>
</div>

        {activeTab === 'profile' && (
          <Profile userProfile={userProfile} setUserProfile={setUserProfile} customProvider={customProvider} setCustomProvider={setCustomProvider} updateUserProfile={updateUserProfile} />
        )}

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

        {activeTab === 'history' && (
          <>
            {/* GRAFICI STATISTICHE CON LOOK SCURO/NEON */}
            <div style={styles.card}>
              <h2 style={styles.title}>ENERGY & COST ANALYTICS {currentYear}</h2>
              <div style={{ marginBottom: '20px' }}>
                <div style={styles.label}>Consumo Energetico (kWh)</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '90px', background: '#18181b', padding: '12px 8px 4px 8px', borderRadius: '12px', border: '1px solid #27272a' }}>
                  {monthlyData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${(d.kwh / maxKwh) * 55}px`, background: 'linear-gradient(to top, #1d4ed8, #3b82f6)', borderRadius: '2px 2px 0 0', boxShadow: '0 0 8px rgba(59,130,246,0.3)' }} />
                      <div style={{ fontSize: '8px', marginTop: '4px', color: '#71717a', fontWeight: '500' }}>{months[i]}</div>
                      <div style={{ fontSize: '9px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>{d.kwh > 0 ? d.kwh.toFixed(0) : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={styles.label}>Spesa Cumulata (€)</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '90px', background: '#18181b', padding: '12px 8px 4px 8px', borderRadius: '12px', border: '1px solid #27272a' }}>
                  {monthlyData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${(d.cost / maxCost) * 55}px`, background: 'linear-gradient(to top, #047857, #10b981)', borderRadius: '2px 2px 0 0', boxShadow: '0 0 8px rgba(16,185,129,0.3)' }} />
                      <div style={{ fontSize: '8px', marginTop: '4px', color: '#71717a', fontWeight: '500' }}>{months[i]}</div>
                      <div style={{ fontSize: '9px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>{d.cost > 0 ? `€${d.cost.toFixed(0)}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CONTATORI IN DIGIT-STYLE */}
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ ...styles.title, marginBottom: 0 }}>LOG CONTROLS</h2>
                <button onClick={cleanDuplicates} className="tech-button secondary" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', padding: '8px 14px', borderRadius: '20px', color: '#f4f4f5', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>CLEAN DATA</button>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: '#18181b', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #27272a' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#3b82f6' }}>{totalKwh.toFixed(0)}</div>
                  <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginTop: '2px' }}>Total kWh</div>
                </div>
                <div style={{ flex: 1, background: '#18181b', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #27272a' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>€ {totalCost.toFixed(2)}</div>
                  <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginTop: '2px' }}>Total Cost</div>
                </div>
                <div style={{ flex: 1, background: '#18181b', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #27272a' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#e4e4e7' }}>{chargings.length}</div>
                  <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginTop: '2px' }}>Sessions</div>
                </div>
              </div>

              {/* EXPORT DATA PANEL - RIGOROSAMENTE CON EFFETTO LUCE VIOLACEA NEON */}
<div style={{ 
  marginBottom: '20px', 
  padding: '14px', 
  background: 'rgba(170, 59, 255, 0.06)', // Sfondo intriso di luce viola
  borderRadius: '14px', 
  border: '1px solid rgba(170, 59, 255, 0.25)', // Bordino viola neon accennato
  boxShadow: '0 0 15px rgba(170, 59, 255, 0.1)', // Bagliore soffuso sotto al pannello
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)'
}}>
  <label style={styles.label}>Export Data Stream (PDF)</label>
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    <div style={{ flex: 1 }}>
      <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} style={{ ...styles.input, background: 'rgba(24, 24, 27, 0.6)', padding: '8px', fontSize: '12px' }} />
    </div>
    <div style={{ flex: 1 }}>
      <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} style={{ ...styles.input, background: 'rgba(24, 24, 27, 0.6)', padding: '8px', fontSize: '12px' }} />
    </div>
    <button onClick={exportToPDF} className="tech-button success" style={{ padding: '10px 18px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Export</button>
  </div>
</div>

              {/* EDITOR MODIFICA */}
              {editingCharge && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#18181b', borderRadius: '14px', border: '1px solid #3f3f46' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>Modify Stream Entry</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{editingCharge.date} • {editingCharge.startTime} → {editingCharge.endTime}</div>
                    </div>
                    <button onClick={cancelEditingCharging} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#ef4444', lineHeight: 1 }}>×</button>
                  </div>
                  <div style={styles.grid2}>
                    <div>
                      <label style={styles.label}>SOC Start • {editingSocInitial}%</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button onClick={() => setEditingSocInitial((v) => Math.max(0, v-1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', fontWeight: 'bold' }}>-</button>
                        <input type="number" value={editingSocInitial} onChange={(e) => setEditingSocInitial(Math.min(99, Math.max(0, Number(e.target.value))))} style={{ ...styles.input, padding: '8px', textAlign: 'center' }} />
                        <button onClick={() => setEditingSocInitial((v) => Math.min(99, v+1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>
                    <div>
                      <label style={styles.label}>SOC Target • {editingSocFinal}%</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button onClick={() => setEditingSocFinal((v) => Math.max(1, v-1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', fontWeight: 'bold' }}>-</button>
                        <input type="number" value={editingSocFinal} onChange={(e) => setEditingSocFinal(Math.min(100, Math.max(1, Number(e.target.value))))} style={{ ...styles.input, padding: '8px', textAlign: 'center' }} />
                        <button onClick={() => setEditingSocFinal((v) => Math.min(100, v+1))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <label style={styles.label}>Power Source (kW)</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button onClick={() => setEditingChargingPower((v) => Math.max(1, v-0.5))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', fontWeight: 'bold' }}>-</button>
                      <input type="number" step="0.5" value={editingChargingPower} onChange={(e) => setEditingChargingPower(Math.min(50, Math.max(1, parseFloat(e.target.value))))} style={{ ...styles.input, padding: '8px', textAlign: 'center' }} />
                      <button onClick={() => setEditingChargingPower((v) => Math.min(50, v+0.5))} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', fontWeight: 'bold' }}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={saveChargingEdit} className="tech-button success" style={{ padding: '10px', fontSize: '12px' }}>Commit</button>
                    <button onClick={cancelEditingCharging} className="tech-button secondary" style={{ background: 'rgba(39, 39, 42, 0.9)', borderColor: 'rgba(255,255,255,0.12)', padding: '10px', fontSize: '12px' }}>Abort</button>
                  </div>
                </div>
              )}

              <History chargings={chargings} onDelete={deleteCharging} onEdit={startEditingCharging} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;