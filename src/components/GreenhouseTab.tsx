import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Sprout, 
  Wind, 
  Bug, 
  Grid, 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Check, 
  FlaskConical, 
  RefreshCw, 
  Layers, 
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { api } from '../services/api';

interface Location {
  id: number;
  name: string;
  type: 'greenhouse' | 'field';
  capacity: number;
}

interface GreenhouseTabProps {
  locations: Location[];
  userRole: string;
  theme: 'light' | 'dark';
}

export default function GreenhouseTab({ locations, userRole, theme }: GreenhouseTabProps) {
  const isManager = userRole === 'admin' || userRole === 'director' || userRole === 'head_agronomist';

  // --- 1. Nutrition & Irrigation States ---
  const [irrigationLogs, setIrrigationLogs] = useState([
    { id: 1, greenhouse: '1-chi issiqxona (Teplitsa)', ph: 6.2, ec: 1.6, date: '2026-05-25 08:30', status: 'optimal' },
    { id: 2, greenhouse: '2-chi issiqxona (Teplitsa)', ph: 5.4, ec: 1.2, date: '2026-05-25 08:15', status: 'low_ph' },
    { id: 3, greenhouse: '3-chi issiqxona (Teplitsa)', ph: 6.8, ec: 2.1, date: '2026-05-25 07:45', status: 'high_ec' }
  ]);
  const [newLogGreenhouse, setNewLogGreenhouse] = useState(locations[0]?.name || '1-chi issiqxona (Teplitsa)');
  const [newLogPh, setNewLogPh] = useState(6.0);
  const [newLogEc, setNewLogEc] = useState(1.5);
  
  // NPK dosage calculator states
  const [calcWaterVolume, setCalcWaterVolume] = useState(100); // in Liters
  const [calcPlantType, setCalcPlantType] = useState('tomato'); // tomato, cucumber, pepper, strawberry

  // --- 2. Germination Analytics States ---
  const [germinationLots, setGerminationLots] = useState([
    { id: 'LOT-2041', crop: 'Pomidor (F1 Siluet)', seedsPlanted: 500, seedsSprouted: 465, rate: 93, date: '2026-05-20' },
    { id: 'LOT-2042', crop: 'Bodring (Orzu F1)', seedsPlanted: 400, seedsSprouted: 388, rate: 97, date: '2026-05-21' },
    { id: 'LOT-2043', crop: 'Bulg\'or qalampiri', seedsPlanted: 300, seedsSprouted: 246, rate: 82, date: '2026-05-22' }
  ]);
  const [newLotCrop, setNewLotCrop] = useState('Pomidor (F1 Cherry)');
  const [newLotSeeds, setNewLotSeeds] = useState(200);
  const [newLotSprouted, setNewLotSprouted] = useState(180);

  // --- 3. Hardening-Off States ---
  const [hardeningBatches, setHardeningBatches] = useState([
    { id: 'PARTIYA-08', crop: 'Pomidor (F1 Siluet)', stage: 2, humidity: 70, temp: 19, status: 'In Progress' },
    { id: 'PARTIYA-09', crop: 'Karam sersoya', stage: 4, humidity: 60, temp: 15, status: 'SOTUVGA TAYYOR 100%' },
    { id: 'PARTIYA-10', crop: 'Bodring (Oq f1)', stage: 1, humidity: 80, temp: 22, status: 'In Progress' }
  ]);

  // --- 4. Pest & Disease (IPM) States ---
  const [greenhouseQuarantines, setGreenhouseQuarantines] = useState<{ [key: string]: boolean }>({
    '3-chi issiqxona (Teplitsa)': true,
  });
  const [pestLogs, setPestLogs] = useState([
    { id: 1, location: '3-chi issiqxona (Teplitsa)', issue: 'Oq-qanot (Aleyrodidlar)', treatment: 'Fitoverm sepildi', status: 'Karantinda', date: '2026-05-24' },
    { id: 2, location: '1-chi issiqxona (Teplitsa)', issue: 'Chirigan ildiz havfi', treatment: 'Kalsiy nitrat sepildi', status: 'Nazorat ostida', date: '2026-05-22' }
  ]);
  const [newPestLocation, setNewPestLocation] = useState(locations[0]?.name || '1-chi issiqxona (Teplitsa)');
  const [newPestIssue, setNewPestIssue] = useState('');
  const [newPestTreatment, setNewPestTreatment] = useState('');

  // --- 5. 2D Visual Layout Map Grid States ---
  const [selectedShelf, setSelectedShelf] = useState<number | null>(1);
  const [quarantinedShelves, setQuarantinedShelves] = useState<number[]>([6]);
  const [shelvesData, setShelvesData] = useState([
    { id: 1, name: 'Sektor A - Javon 1', crop: 'Tomato F1 Siluet', batch: 'PARTIYA-08', stage: 'Chiniqtirish', temp: '20°C', moisture: '65%', health: 'Excellent' },
    { id: 2, name: 'Sektor A - Javon 2', crop: 'Bodring Orzu F1', batch: 'PARTIYA-10', stage: 'Urug\' unish', temp: '24°C', moisture: '82%', health: 'Optimal' },
    { id: 3, name: 'Sektor B - Javon 3', crop: 'Qalampir Xit', batch: 'PARTIYA-11', stage: 'Ko\'chatlik', temp: '21°C', moisture: '70%', health: 'Optimal' },
    { id: 4, name: 'Sektor B - Javon 4', crop: 'Empty / Bo\'sh', batch: '—', stage: '—', temp: '20°C', moisture: '55%', health: '—' },
    { id: 5, name: 'Sektor C - Javon 5', crop: 'Karam Sersoya', batch: 'PARTIYA-09', stage: 'Sotuvga tayyor', temp: '16°C', moisture: '60%', health: 'Excellent' },
    { id: 6, name: 'Sektor C - Javon 6', crop: 'Mog\'or xavfi ostidagi bo\'lim', batch: '—', stage: 'Karantin', temp: '18°C', moisture: '85%', health: 'Warning' }
  ]);

  const toggleShelfQuarantine = (shelfId: number) => {
    setQuarantinedShelves(prev => {
      const isCurrentlyQuarantined = prev.includes(shelfId);
      const nextQuarantined = isCurrentlyQuarantined 
        ? prev.filter(id => id !== shelfId) 
        : [...prev, shelfId];
      
      setShelvesData(current => current.map(item => {
        if (item.id === shelfId) {
          return {
            ...item,
            stage: isCurrentlyQuarantined 
              ? (shelfId === 1 ? 'Chiniqtirish' : shelfId === 2 ? 'Urug\' unish' : shelfId === 3 ? 'Ko\'chatlik' : shelfId === 5 ? 'Sotuvga tayyor' : '—')
              : 'Karantin',
            health: isCurrentlyQuarantined ? 'Optimal' : 'Warning'
          };
        }
        return item;
      }));
      return nextQuarantined;
    });
  };

  // NPK calculation logic
  const calculateNPK = () => {
    let multiplier = 1.0;
    if (calcPlantType === 'cucumber') multiplier = 1.25;
    if (calcPlantType === 'pepper') multiplier = 1.1;
    if (calcPlantType === 'strawberry') multiplier = 0.85;

    const nitrogen = (0.15 * calcWaterVolume * multiplier).toFixed(1);
    const phosphorus = (0.08 * calcWaterVolume * multiplier).toFixed(1);
    const potassium = (0.22 * calcWaterVolume * multiplier).toFixed(1);
    const micronutrients = (0.02 * calcWaterVolume * multiplier).toFixed(1);

    return { nitrogen, phosphorus, potassium, micronutrients };
  };

  const npk = calculateNPK();

  // Save new pH/EC log
  const handleAddIrrigationLog = (e: React.FormEvent) => {
    e.preventDefault();
    let status = 'optimal';
    if (newLogPh < 5.5) status = 'low_ph';
    else if (newLogPh > 6.5) status = 'high_ph';
    else if (newLogEc < 1.2) status = 'low_ec';
    else if (newLogEc > 2.0) status = 'high_ec';

    const newLog = {
      id: Date.now(),
      greenhouse: newLogGreenhouse,
      ph: newLogPh,
      ec: newLogEc,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status
    };

    setIrrigationLogs([newLog, ...irrigationLogs]);
  };

  // Add Germination Lot
  const handleAddGerminationLot = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Math.round((newLotSprouted / newLotSeeds) * 100);
    const newLot = {
      id: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      crop: newLotCrop,
      seedsPlanted: newLotSeeds,
      seedsSprouted: newLotSprouted,
      rate,
      date: new Date().toISOString().split('T')[0]
    };
    setGerminationLots([newLot, ...germinationLots]);
  };

  // Process Hardening Batch progression
  const handleAdvanceHardening = (id: string) => {
    setHardeningBatches(prev => prev.map(b => {
      if (b.id === id) {
        const nextStage = b.stage < 4 ? b.stage + 1 : 4;
        let nextTemp = b.temp;
        let nextHum = b.humidity;
        if (nextStage === 2) { nextTemp = 18; nextHum = 70; }
        if (nextStage === 3) { nextTemp = 16; nextHum = 65; }
        if (nextStage === 4) { nextTemp = 14; nextHum = 58; }
        
        return {
          ...b,
          stage: nextStage,
          temp: nextTemp,
          humidity: nextHum,
          status: nextStage === 4 ? 'SOTUVGA TAYYOR 100%' : 'In Progress'
        };
      }
      return b;
    }));
  };

  // Toggle quarantine for greenhouse sector
  const toggleQuarantine = (greenhouse: string) => {
    setGreenhouseQuarantines(prev => ({
      ...prev,
      [greenhouse]: !prev[greenhouse]
    }));
  };

  // Add new pest journal record
  const handleAddPestLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPestIssue.trim()) return;

    const newLog = {
      id: Date.now(),
      location: newPestLocation,
      issue: newPestIssue,
      treatment: newPestTreatment || 'Kuzatuvga olindi',
      status: greenhouseQuarantines[newPestLocation] ? 'Karantinda' : 'Nazorat ostida',
      date: new Date().toISOString().split('T')[0]
    };

    setPestLogs([newLog, ...pestLogs]);
    setNewPestIssue('');
    setNewPestTreatment('');
  };

  const activeShelf = shelvesData.find(s => s.id === selectedShelf);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Overview Head Card */}
      <div className={`p-6 border rounded-none ${
        theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-emerald-50/40 border-emerald-100'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center border ${
              theme === 'dark' ? 'bg-[#00FF00]/10 border-[#00FF00]/30 text-[#00FF00]' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
            }`}>
              <Sparkles className="h-5 w-5 animate-spin duration-3000" />
            </div>
            <div>
              <h2 className={`font-mono font-black uppercase tracking-wider text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                🌱 AQLLI ISSIQXONA KENGAYTIRILGAN ANALITIKASI
              </h2>
              <p className="text-gray-500 font-sans text-xs mt-0.5">
                Suv dori nazorati, unib chiqish koeffitsiyenti, chiniqtirish bosqichlari hamda issiqxona 2D jadvalli tahlili tizimi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-650/10 dark:bg-[#00FF00]/10 px-3 py-1.5 border border-emerald-600/20 rounded-md">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping"></span>
            <span className="font-mono text-[9.5px] font-bold text-emerald-600 dark:text-[#00FF00] uppercase tracking-wider">
              AGR-AI FAOL
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* SECTION 1: pH / EC NUTRIATION & NPK CALCULATOR (Left/Side Column 5 xl span) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* pH & EC Meter Tracker */}
          <div className={`p-5 border rounded-none flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`font-mono font-black uppercase text-[11px] tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between ${
              theme === 'dark' ? 'text-white border-zinc-800' : 'text-slate-900 border-slate-100'
            }`}>
              <span className="flex items-center gap-2"><Droplet className="h-4 w-4 text-sky-500" /> pH & EC Eritma Jurnali</span>
              <span className="text-[9px] text-[#00FF00] lowercase font-normal">Suyuqlik o'lchamlari</span>
            </h3>

            {/* Parameter range guide badge */}
            <div className="mb-4 bg-slate-50 dark:bg-[#1A1A1A] p-2.5 rounded-md border border-slate-100 dark:border-zinc-850 grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div>
                <span className="text-gray-400">Optimal pH:</span> <span className="font-bold text-emerald-500">5.5 – 6.5</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Optimal EC:</span> <span className="font-bold text-emerald-500">1.2 – 2.0 mS</span>
              </div>
            </div>

            {/* Log form */}
            <form onSubmit={handleAddIrrigationLog} className="space-y-3 mb-4 border-b pb-4 border-slate-100 dark:border-zinc-850">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Joy/Issiqxona</label>
                  <select
                    value={newLogGreenhouse}
                    onChange={e => setNewLogGreenhouse(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Kislotalilik (pH)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="14"
                    value={newLogPh}
                    onChange={e => setNewLogPh(parseFloat(e.target.value) || 6.0)}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 font-mono text-center focus:outline-none focus:border-sky-500 text-sky-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Tuz kons. (EC)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={newLogEc}
                    onChange={e => setNewLogEc(parseFloat(e.target.value) || 1.5)}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 font-mono text-center focus:outline-none focus:border-amber-500 text-amber-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-950/40 dark:hover:bg-emerald-900/30 dark:border dark:border-emerald-500/30 dark:text-[#00FF00] py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors"
              >
                💾 O'lchamni Saqlash
              </button>
            </form>

            {/* List */}
            <div className="space-y-1.5 max-h-[148px] overflow-y-auto">
              {irrigationLogs.map(log => {
                let statusText = 'Optimal';
                let style = 'bg-emerald-50/70 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400';
                if (log.status === 'low_ph') {
                  statusText = 'pH Juda past (Kislotali)';
                  style = 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400';
                } else if (log.status === 'high_ph') {
                  statusText = 'pH Juda baland (Ishqoriy)';
                  style = 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400';
                } else if (log.status === 'low_ec') {
                  statusText = 'EC Kam (Kam ozuqa)';
                  style = 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400';
                } else if (log.status === 'high_ec') {
                  statusText = "EC Baland (Sho'rlanish)";
                  style = 'bg-red-50 border-red-100 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400';
                }

                return (
                  <div key={log.id} className={`p-2 border text-[9.5px] font-mono flex items-center justify-between rounded-md ${style}`}>
                    <div>
                      <span className="font-sans font-bold block truncate">{log.greenhouse}</span>
                      <span className="opacity-60 text-[8px]">{log.date}</span>
                    </div>
                    <div className="text-right">
                      <div className="space-x-2">
                        <span>pH: <span className="font-bold">{log.ph}</span></span>
                        <span>EC: <span className="font-bold">{log.ec}</span></span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider block font-bold mt-0.5">{statusText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intelligent NPK Dosages Calculator */}
          <div className={`p-5 border rounded-none flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`font-mono font-black uppercase text-[11px] tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between ${
              theme === 'dark' ? 'text-white border-zinc-800' : 'text-slate-900 border-slate-100'
            }`}>
              <span className="flex items-center gap-2"><Calculator className="h-4 w-4 text-emerald-500" /> NPK O'g'it va Doza Kalkulyatori</span>
              <span className="text-[9px] text-gray-500 font-normal">Agrar qorishma yordamchisi</span>
            </h3>

            <div className="space-y-4">
              {/* Select plant type */}
              <div>
                <label className="text-[9.5px] font-mono uppercase text-gray-400 block mb-1">Ko'chat Ekin turi</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { key: 'tomato', name: '🍅 Pomidor' },
                    { key: 'cucumber', name: '🥒 Bodring' },
                    { key: 'pepper', name: '🫑 Qalampir' },
                    { key: 'strawberry', name: '🍓 Qulupnay' }
                  ].map(plant => (
                    <button
                      key={plant.key}
                      onClick={() => setCalcPlantType(plant.key)}
                      type="button"
                      className={`py-1 text-[8.5px] text-center font-bold font-sans border rounded-md cursor-pointer transition-all ${
                        calcPlantType === plant.key 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/45 dark:border-[#00FF00]/40 dark:text-[#00FF00]'
                          : 'bg-white border-slate-200 text-gray-500 hover:bg-slate-50 dark:bg-black dark:border-zinc-800 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {plant.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Water amount input */}
              <div>
                <div className="flex justify-between items-baseline mb-1 font-mono text-[9.5px]">
                  <span className="text-gray-405">SUYULISH SUV HAJMI:</span>
                  <span className="text-emerald-600 dark:text-[#00FF00] font-black">{calcWaterVolume} litr</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={calcWaterVolume}
                  onChange={e => setCalcWaterVolume(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                />
              </div>

              {/* Formula calculations wrapper output */}
              <div className="bg-slate-50 dark:bg-[#1A1A1A] border border-slate-100 dark:border-zinc-850 p-3 rounded-md grid grid-cols-4 gap-2 text-center font-mono select-none">
                <div className="p-1">
                  <span className="text-[8.5px] text-gray-400 block uppercase">N (Azot)</span>
                  <span className="text-base font-black text-rose-500 dark:text-rose-400 block mt-1">{npk.nitrogen} g</span>
                  <span className="text-[7.5px] text-gray-500 leading-none block">Yashil barg</span>
                </div>
                <div className="p-1">
                  <span className="text-[8.5px] text-gray-400 block uppercase">P (Fosfor)</span>
                  <span className="text-base font-black text-amber-500 block mt-1">{npk.phosphorus} g</span>
                  <span className="text-[7.5px] text-gray-500 leading-none block">Ildiz shakli</span>
                </div>
                <div className="p-1">
                  <span className="text-[8.5px] text-gray-400 block uppercase">K (Kaliy)</span>
                  <span className="text-base font-black text-sky-500 block mt-1">{npk.potassium} g</span>
                  <span className="text-[7.5px] text-gray-500 leading-none block">Meva & Sifat</span>
                </div>
                <div className="p-1">
                  <span className="text-[8.5px] text-gray-400 block uppercase">Mikro (Fe, Mg)</span>
                  <span className="text-base font-black text-zinc-500 block mt-1">{npk.micronutrients} g</span>
                  <span className="text-[7.5px] text-gray-500 leading-none block">Minerallar</span>
                </div>
              </div>

              {/* Advice */}
              <div className="text-[8.5px] leading-relaxed text-gray-500 dark:text-[#888888] font-sans flex items-start gap-1 pb-1">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                <span>NPK qo'shimchasini dastlab ozroq suvda eriting, so'ngra optimal EC qiymatiga yetguncha asosiy sig'imga aralashtiring. pH darajasini dori sepilgandan keyin tekshiring. </span>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 2: GERMINATION ANALYTICS AND HARDENING-OFF STAGE (Right/Middle 7 xl span) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Germination Rate & Analytics */}
          <div className={`p-5 border rounded-none flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`font-mono font-black uppercase text-[11px] tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between ${
              theme === 'dark' ? 'text-white border-zinc-800' : 'text-slate-900 border-slate-100'
            }`}>
              <span className="flex items-center gap-2"><Sprout className="h-4 w-4 text-[#00FF00]" /> Urug' Unuvchanlik Koeffitsiyenti Analitikasi</span>
              <span className="text-[9px] text-[#00FF00] font-normal uppercase">Unib chiqish foizi</span>
            </h3>

            {/* Input germ form */}
            <form onSubmit={handleAddGerminationLot} className="space-y-3 mb-4 rounded-md border border-slate-150 border-dashed dark:border-zinc-800 p-3 bg-slate-50/40 dark:bg-black/20">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-black block">Yangi unish testini kiritish:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Ekin & Nav nomi</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Pomidor Cherry"
                    value={newLotCrop}
                    onChange={e => setNewLotCrop(e.target.value)}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Ekilgan urug'lar (dona)</label>
                  <input
                    type="number"
                    min="1"
                    value={newLotSeeds}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setNewLotSeeds(val);
                      if (newLotSprouted > val) setNewLotSprouted(val);
                    }}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 font-mono text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Unib chiqqan (ko'chat)</label>
                  <input
                    type="number"
                    min="0"
                    max={newLotSeeds}
                    value={newLotSprouted}
                    onChange={e => setNewLotSprouted(Math.min(parseInt(e.target.value) || 0, newLotSeeds))}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 font-mono text-center focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-[9px] font-mono text-slate-400">HISOBLANGAN FOIZ: <span className="font-bold text-sky-500">{Math.round((newLotSprouted / newLotSeeds) * 100)}%</span></span>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-mono font-bold uppercase tracking-wider text-[9px] px-3 py-1 rounded-md cursor-pointer text-right transition-colors"
                >
                  🚀 Test saqlash
                </button>
              </div>
            </form>

            {/* Grid list of lots */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {germinationLots.map(lot => {
                const isGreat = lot.rate >= 90;
                const isMedium = lot.rate >= 80 && lot.rate < 90;
                
                return (
                  <div 
                    key={lot.id} 
                    className={`p-3 border rounded-md flex flex-col justify-between ${
                      theme === 'dark' ? 'bg-[#151515] border-zinc-850' : 'bg-gray-50/40 border-slate-200 shadow-3xs'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1 select-none">
                        <span className="text-[8.5px] font-mono font-bold text-gray-400">{lot.id}</span>
                        <span className="text-[8.5px] font-mono text-gray-500">{lot.date}</span>
                      </div>
                      <span className={`font-sans font-bold text-[11px] block truncate leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {lot.crop}
                      </span>
                      <span className="text-[9.5px] font-mono text-gray-400 mt-1 block">
                        Urug': <span className="text-gray-600 dark:text-gray-300 font-bold">{lot.seedsPlanted}</span> / Unishi: <span className="text-gray-630 dark:text-gray-300 font-bold">{lot.seedsSprouted} d</span>
                      </span>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-zinc-850 select-none">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] uppercase tracking-wider text-gray-400 font-mono">Unuvchanlik foiz:</span>
                        <span className={`text-[11px] font-black font-mono ${
                          isGreat ? 'text-[#00FF00]' : isMedium ? 'text-amber-500' : 'text-rose-500'
                        }`}>{lot.rate}%</span>
                      </div>
                      
                      {/* Sub-bar */}
                      <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            isGreat ? 'bg-[#00FF00]' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${lot.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gap transplantation task warning */}
            <div className="mt-4 bg-emerald-950/15 border border-dashed border-emerald-500/35 p-2.5 rounded-md flex gap-2 items-start text-[9.5px]">
              <AlertTriangle className="h-4 w-4 text-[#00FF00] shrink-0 mt-0.5 animate-bounce" />
              <div className="leading-normal font-sans text-gray-400">
                <span className="font-bold text-[#00FF00] uppercase block mb-0.5">⚠️ KASSETALARNI TO'LDIRISH TAVSIYASI (TRASPLANTATSIYA CO-PILOT):</span>
                <span>"LOT-2043" partiyasining unuvchanligi 82% ni tashkil qilgani sababli 54 ta katak bo'sh qoldi. Bo'sh kataklarni unib chiqqan zaxira kassetalar yordamida tezkor qayta to'ldirish tavsiya etiladi. </span>
              </div>
            </div>
          </div>

          {/* Hardening Off Stage Tracker (Acclimatization) */}
          <div className={`p-5 border rounded-none flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`font-mono font-black uppercase text-[11px] tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between ${
              theme === 'dark' ? 'text-white border-zinc-800' : 'text-slate-900 border-slate-100'
            }`}>
              <span className="flex items-center gap-2"><Wind className="h-4 w-4 text-sky-400 animate-pulse" /> Ko'chat Chiniqtirish (Hardening-Off) Bosqichi Monitoringi</span>
              <span className="text-[9px] text-sky-450 uppercase font-normal">Tashqi muhitga tayyorgarlik</span>
            </h3>

            {/* Acclimatization 4-step guideline */}
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[8px] mb-4 select-none">
              <div className="bg-slate-50 dark:bg-black p-1 border border-zinc-250 dark:border-zinc-850 rounded-md">
                <span className="font-bold block text-sky-400">1-BOSQICH</span>
                <span className="text-zinc-500 block">Soya/Shamol havf</span>
                <span className="text-zinc-500">24°C / RH 80%</span>
              </div>
              <div className="bg-slate-50 dark:bg-black p-1 border border-zinc-250 dark:border-zinc-850 rounded-md">
                <span className="font-bold block text-amber-500">2-BOSQICH</span>
                <span className="text-zinc-500 block">Namlik pasayish</span>
                <span className="text-zinc-500">20°C / RH 70%</span>
              </div>
              <div className="bg-slate-50 dark:bg-black p-1 border border-zinc-250 dark:border-zinc-850 rounded-md">
                <span className="font-bold block text-pink-500">3-BOSQICH</span>
                <span className="text-zinc-500 block">Sovuq chiniqish</span>
                <span className="text-zinc-500">16°C / RH 65%</span>
              </div>
              <div className="bg-slate-50 dark:bg-black p-1 border border-zinc-250 dark:border-zinc-850 rounded-md">
                <span className="font-bold block text-emerald-500">4-BOSQICH</span>
                <span className="text-[#00FF00] block">Tayyor ko'chat</span>
                <span className="text-zinc-500">14°C / RH 58%</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {hardeningBatches.map(batch => (
                <div 
                  key={batch.id} 
                  className={`p-3 border rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    batch.stage === 4 
                      ? 'bg-emerald-950/20 border-[#00FF00]/40 text-[#00FF00]' 
                      : (theme === 'dark' ? 'bg-[#151515] border-zinc-850' : 'bg-slate-50/50 border-slate-200')
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold text-gray-400">{batch.id}</span>
                      <span className={`text-[8.5px] uppercase font-mono px-1.5 py-0.5 rounded-md ${
                        batch.stage === 4 ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
                      }`}>{batch.status}</span>
                    </div>
                    <span className={`font-bold text-[11px] block ${batch.stage === 4 ? '' : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>{batch.crop}</span>
                    <div className="flex items-center gap-3 font-mono text-[9px] text-gray-400">
                      <span>Harorat: <span className="font-bold text-zinc-300">{batch.temp}°C</span></span>
                      <span>Havodagi namlik: <span className="font-bold text-zinc-300">{batch.humidity}%</span></span>
                    </div>
                  </div>

                  {/* Stage view bar */}
                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0 select-none">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(step => (
                        <div
                          key={step}
                          className={`w-4 h-4 rounded-none font-mono text-[8px] flex items-center justify-center font-bold border transition-colors ${
                            step <= batch.stage
                              ? 'bg-sky-500 border-sky-400 text-white'
                              : 'bg-transparent border-gray-300 text-gray-400 dark:border-zinc-800'
                          }`}
                        >
                          {step}
                        </div>
                      ))}
                    </div>

                    {isManager && batch.stage < 4 && (
                      <button
                        onClick={() => handleAdvanceHardening(batch.id)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white hover:text-[#00FF00] dark:bg-black dark:border dark:border-zinc-800 dark:hover:border-zinc-75s font-mono text-[8.5px] font-bold uppercase tracking-wider rounded-md cursor-pointer flex items-center gap-1"
                      >
                        Chiniqtirish <ChevronRight className="h-2.5 w-2.5" />
                      </button>
                    )}

                    {batch.stage === 4 && (
                      <div className="flex items-center gap-1 text-[#00FF00] font-mono text-[9px] font-black uppercase">
                        <Check className="h-4 w-4 bg-[#00FF00]/15 rounded-md p-0.5" /> TAYYOR 
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* SECTION 3: INTEGRATED PEST MANAGEMENT (IPM) - Fitosanitariya nazorati */}
        <div className="xl:col-span-5 space-y-6">
          
          <div className={`p-5 border rounded-none flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`font-mono font-black uppercase text-[11px] tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between ${
              theme === 'dark' ? 'text-white border-zinc-800' : 'text-slate-900 border-slate-100'
            }`}>
              <span className="flex items-center gap-2"><Bug className="h-4 w-4 text-purple-500" /> Fitosanitariya Jurnali & Karantin Nazorati</span>
              <span className="text-[9px] text-red-500 font-normal uppercase">Karantin zonalari</span>
            </h3>

            {/* Quick greenhouse quarantine toggle switches */}
            <div className="mb-4 bg-slate-50 dark:bg-[#1A1A1A] p-3 rounded-md border border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-black block mb-2">🏢 TEPLITSA ZONE KARANTIN CHEKLASH TUGMALARI:</span>
              <div className="space-y-1.5 text-xs font-mono">
                {locations.filter(l => l.type === 'greenhouse').map(greenhouse => {
                  const queryQuarantine = greenhouseQuarantines[greenhouse.name];
                  return (
                    <div key={greenhouse.id} className="flex justify-between items-center bg-white dark:bg-black p-1.5 border border-slate-100 dark:border-zinc-900 rounded-md">
                      <span>{greenhouse.name}</span>
                      {isManager ? (
                        <button
                          onClick={() => toggleQuarantine(greenhouse.name)}
                          className={`px-2 py-0.5 text-[8.5px] font-bold uppercase rounded-md border cursor-pointer ${
                            queryQuarantine 
                              ? 'bg-rose-950/20 text-rose-500 border-rose-500/30' 
                              : 'bg-zinc-800 text-zinc-400 border-transparent hover:text-white'
                          }`}
                          type="button"
                        >
                          {queryQuarantine ? '⚠️ [KARANTIN FAOL]' : '[YAXSHI HOLAT]'}
                        </button>
                      ) : (
                        <span className={`text-[8.5px] font-bold uppercase ${queryQuarantine ? 'text-rose-500' : 'text-gray-400'}`}>
                          {queryQuarantine ? '⚠️ [KARANTIN]' : '[TOZA]'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quarantine/pest journal form */}
            <form onSubmit={handleAddPestLog} className="space-y-3 mb-4 border-b pb-4 border-slate-100 dark:border-zinc-850">
              <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">Yangi dori/zararkunanda hodisasi jurnali:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Lokatsiya</label>
                  <select
                    value={newPestLocation}
                    onChange={e => setNewPestLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 focus:outline-none focus:border-purple-500 font-sans"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Hodisa / Muammo</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Mog'orlanish..."
                    value={newPestIssue}
                    onChange={e => setNewPestIssue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 focus:outline-none focus:border-purple-500 font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Zararsizlantirish chorasi yoki preparat</label>
                <input
                  type="text"
                  placeholder="Masalan: Biogum miks dori seping"
                  value={newPestTreatment}
                  onChange={e => setNewPestTreatment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-[10px] p-1.5 focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-650 hover:bg-purple-700 text-white dark:bg-purple-950/40 dark:hover:bg-purple-900/30 dark:border dark:border-purple-500/30 dark:text-purple-400 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors"
              >
                💾 IPM Fitosanitar jurnallash
              </button>
            </form>

            {/* Mini Log */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto font-mono text-[9px]">
              {pestLogs.map(log => {
                const isQuarantine = greenhouseQuarantines[log.location];
                return (
                  <div key={log.id} className={`p-2 border rounded-md ${
                    isQuarantine 
                      ? 'bg-red-950/10 border-red-500/20 text-rose-500' 
                      : (theme === 'dark' ? 'bg-[#151515] border-zinc-900 text-zinc-300' : 'bg-slate-50/50 border-slate-200 text-slate-700')
                  }`}>
                    <div className="flex justify-between">
                      <span className="font-sans font-bold block">{log.location}</span>
                      <span className="text-[8px] opacity-65">{log.date}</span>
                    </div>
                    <div className="mt-1 font-sans">
                      <span className="font-mono font-bold text-gray-400">Kasallik:</span> <span className="font-bold">{log.issue}</span>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-gray-400">Sepilgan dori:</span> <span>{log.treatment}</span>
                    </div>
                    <span className={`text-[8px] uppercase tracking-wider font-bold block mt-1 ${isQuarantine ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                      STATUS: {isQuarantine ? '🚨 Karantin maydoni' : '✅ Nazorat ostida'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* SECTION 4: 2D INTERACTIVE GREENHOUSE LAYOUT MAP CANVAS (Right span 7) */}
        <div className="xl:col-span-7 space-y-6">
          
          <div className={`p-5 border rounded-none flex flex-col justify-between h-full ${
            theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`font-mono font-black uppercase text-[11px] tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between ${
              theme === 'dark' ? 'text-white border-zinc-800' : 'text-slate-900 border-slate-100'
            }`}>
              <span className="flex items-center gap-2"><Grid className="h-4 w-4 text-emerald-550 animate-pulse" /> 2D Vizual Issiqxona Stellaj Stellari Xaritasi</span>
              <span className="text-[9px] text-[#00FF00] font-normal uppercase">Kondensat & Javon rejalashtirish</span>
            </h3>

            {/* Intro text */}
            <p className="text-[10px] text-gray-550 mb-4 font-sans leading-relaxed">
              Bu 2D simulyatsiya xaritasida issiqxonaning javonlar yoki stellajlar bo'yicha ekin partiyalari joylashuvi keltirilgan. Tafsilotlar panelini tomosha qilish uchun har qaysi javon ustiga bosing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side: 2D Shelf Grid visual panels */}
              <div className="grid grid-cols-2 gap-2">
                {shelvesData.map(shelf => {
                  const isSelected = selectedShelf === shelf.id;
                  const isQuarantine = quarantinedShelves.includes(shelf.id);
                  const isEmpty = shelf.crop.includes('Bo\'sh');
                  
                  let bgCard = theme === 'dark' ? 'bg-[#151515] border-zinc-850 hover:bg-zinc-900/80' : 'bg-gray-50 hover:bg-gray-100/75';
                  
                  if (isQuarantine) {
                    bgCard = theme === 'dark' 
                      ? 'bg-amber-955/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse' 
                      : 'bg-amber-50 border-amber-400 text-amber-900 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse';
                  } else if (isSelected) {
                    bgCard = theme === 'dark' ? 'bg-emerald-950/25 border-[#00FF00] text-white shadow-lg' : 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs';
                  }

                  return (
                    <button
                      key={shelf.id}
                      onClick={() => setSelectedShelf(shelf.id)}
                      type="button"
                      className={`p-3 text-left border rounded-md transition-all cursor-pointer flex flex-col justify-between h-[85px] relative overflow-hidden ${bgCard}`}
                    >
                      {/* Grid number index identifier on background */}
                      <span className="absolute right-1 bottom-1 text-[26px] font-mono font-black opacity-[0.05]">{shelf.id}</span>
                      
                      {/* Direct click-to-quarantine toggle on 2D map */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleShelfQuarantine(shelf.id);
                        }}
                        className={`absolute top-1 right-1 p-1 rounded-md z-10 transition-all cursor-pointer ${
                          isQuarantine 
                            ? 'bg-amber-500 text-black border border-amber-500 font-bold hover:bg-amber-450' 
                            : 'bg-black/40 border border-zinc-800 hover:border-amber-500/50 text-gray-400 hover:text-amber-500 hover:bg-amber-500/10'
                        }`}
                        title={isQuarantine ? "Karantindan chiqarish" : "Kliklab karantinga olish"}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                      </span>

                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="text-[8.5px] font-mono tracking-wide text-zinc-400 uppercase font-black block">{shelf.name}</span>
                        <span className="text-[11px] font-sans font-bold block truncate">{shelf.crop}</span>
                      </div>

                      <div className="flex justify-between items-center text-[8px] font-mono mt-1 pt-1 border-t border-slate-200/40">
                        <span>{shelf.batch}</span>
                        <span className={`font-bold uppercase ${
                          isQuarantine ? 'text-amber-500 animate-pulse font-black' : isEmpty ? 'text-gray-400' : 'text-[#00FF00]'
                        }`}>{isQuarantine ? '🚨 Karantin' : shelf.stage}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Selected table detail view */}
              <div className={`p-4 border rounded-md flex flex-col justify-between ${
                theme === 'dark' ? 'bg-[#151515] border-zinc-850' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                {activeShelf ? (
                  <div className="space-y-3.5 select-none">
                    <div className="border-b pb-2 border-slate-200/60 dark:border-zinc-800">
                      <span className="text-[8.5px] font-mono uppercase text-gray-400 block">TANLANGAN LOKATSIYA:</span>
                      <h4 className={`text-xs font-mono font-black uppercase text-emerald-600 dark:text-[#00FF00] mt-0.5`}>{activeShelf.name}</h4>
                    </div>

                    <div className="space-y-2 text-[10px] font-mono text-gray-500">
                      <div className="flex justify-between">
                        <span>Ekin navi:</span>
                        <span className="font-sans font-bold text-gray-700 dark:text-zinc-200">{activeShelf.crop}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tegishli Partiya:</span>
                        <span className="font-sans font-bold text-gray-700 dark:text-zinc-200">{activeShelf.batch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rivojlanish faza:</span>
                        <span className="font-bold text-sky-500 uppercase">{activeShelf.stage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amaldagi harorat:</span>
                        <span className="font-bold text-gray-700 dark:text-zinc-200">{activeShelf.temp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tuproq/havo namligi:</span>
                        <span className="font-bold text-gray-700 dark:text-zinc-200">{activeShelf.moisture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ekin salomatligi:</span>
                        <span className={`font-bold ${
                          quarantinedShelves.includes(activeShelf.id) 
                            ? 'text-amber-500 animate-pulse' 
                            : activeShelf.health === 'Excellent' 
                              ? 'text-emerald-500' 
                              : activeShelf.health === 'Optimal' 
                                ? 'text-sky-500' 
                                : 'text-amber-500'
                        }`}>{quarantinedShelves.includes(activeShelf.id) ? '⚠️ XAVF OSTIDA / KARANTIN' : activeShelf.health}</span>
                      </div>
                    </div>

                    {/* Operational advice dynamic */}
                    <div className="mt-3 p-2 bg-emerald-50/20 border border-emerald-500/20 rounded-md text-[8.5px] leading-relaxed text-zinc-500">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-0.5">💡 Avtomatik Agronom tavsiyasi:</span>
                      {quarantinedShelves.includes(activeShelf.id) && "Zararkunanda tarqalgani sababli karantin maydoni. O'zaro yuqishining oldini olish uchun ushbu javondagi fito-panjaralarni bevosita sterilizatsiya qiling!"}
                      {!quarantinedShelves.includes(activeShelf.id) && activeShelf.stage === 'Chiniqtirish' && "Ushbu javondagi ko'chatlar chiniqmoqda. Ularni 36 soatdan so'ng tashqi muhitga (Ochiq dala A) ekish rejasini agronomga yuborish mumkin."}
                      {!quarantinedShelves.includes(activeShelf.id) && activeShelf.stage === 'Urug\' unish' && "Urug'larning unish fazasi jadal ketmoqda. Namlik darajasi optimal (82%). pH dori aralashmasini pH 6.0 EC 1.5 me'yorda sug'orishni davom ettiring."}
                      {!quarantinedShelves.includes(activeShelf.id) && activeShelf.stage === 'Karantin' && "Zararkunanda tarqalgani taxmin qilinayotgan karantin maydoni. O'zaro yuqishining oldini olish uchun ushbu javondagi fito-panjaralarni bevosita sterilizatsiya qiling!"}
                      {!quarantinedShelves.includes(activeShelf.id) && activeShelf.stage === '—' && "Javon bo'sh. Erkin sig'im mavjud. Yangi partiyalarni urug'likdan chiqargandan so'ng dastlab ushbu seksiya bo'shlig'iga kiritish tavsiya etiladi."}
                      {!quarantinedShelves.includes(activeShelf.id) && activeShelf.stage === 'Sotuvga tayyor' && "Hardening chiniqtirish tugagan. Partiyaning unuvchanligi 97%. Sotuvlar paneliga kirib bevosita buyurtma rasmiylashtirish yoki hisob-faktura yuborish mumkin!"}
                      {!quarantinedShelves.includes(activeShelf.id) && activeShelf.stage === 'Ko\'chatlik' && "Ko'chat barglari to'liq shakllangan. Kunduzgi haroratni o'g'it dozasi bilan birgalikda barqaror shaklda ta'minlang."}
                    </div>

                    {/* Sektor Karantin Switch Button */}
                    <button
                      onClick={() => toggleShelfQuarantine(activeShelf.id)}
                      className={`w-full py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-center border cursor-pointer transition-all duration-150 rounded-md ${
                        quarantinedShelves.includes(activeShelf.id)
                          ? 'bg-emerald-955/20 hover:bg-emerald-900/20 text-[#00FF00] border-emerald-500/30'
                          : 'bg-amber-955/20 hover:bg-amber-900/20 text-amber-500 border-amber-500/30'
                      }`}
                      type="button"
                    >
                      {quarantinedShelves.includes(activeShelf.id) 
                        ? '🟢 Sektor Karantindan Chiqarish' 
                        : '🚨 Sektorni Karantinga Olish'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 font-mono text-gray-400">
                    Javondan sektor tanlang
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
