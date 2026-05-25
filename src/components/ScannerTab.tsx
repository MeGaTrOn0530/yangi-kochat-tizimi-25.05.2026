import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plant, Batch, PlantStage, Location, PlantType, Variety } from '../types';
import { QrCode, Scan, Search, CheckCircle2, ShieldAlert, FileText, Camera, RefreshCw } from 'lucide-react';
// @ts-ignore
import QrScanner from 'react-qr-scanner';

interface ScannerTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  userId: number;
  userRole: string;
}

export default function ScannerTab({ locations, plantTypes, varieties, userId, userRole }: ScannerTabProps) {
  const [qrInput, setQrInput] = useState('');
  const [activePlants, setActivePlants] = useState<Plant[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Camera Reader integration states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'rear' | 'front'>('rear');

  // Scan Results
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Single Plant States
  const [targetStage, setTargetStage] = useState<PlantStage>('cassette');
  const [notes, setNotes] = useState('');
  const [isDefect, setIsDefect] = useState(false);
  const [defectImage, setDefectImage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Multiple Plants States (for Batch)
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);

  // Realistic sample defect images for simulation selection
  const defectMockImages = [
    { title: 'Ildiz Chirishi', url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=400' },
    { title: 'Barglar Sarg’ayishi', url: 'https://images.unsplash.com/photo-1599599810688-dfefc1bfd673?q=80&w=400' },
    { title: 'Mexanik jarohat', url: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?q=80&w=400' }
  ];

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const bList = await api.getBatches();
      setAllBatches(bList);
      
      // Load current active plants
      let plantsPool: Plant[] = [];
      for (const b of bList) {
        const bp = await api.getBatchPlants(b.id);
        plantsPool = [...plantsPool, ...bp];
      }
      setActivePlants(plantsPool);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleScan = (data: any) => {
    if (data) {
      // Some versions of react-qr-scanner return an object with a text prop, others return string
      const scannedCode = (data && typeof data === 'object' && data.text) ? data.text : (typeof data === 'string' ? data : null);
      if (scannedCode) {
        setQrInput(scannedCode);
        handleSearchQR(scannedCode);
        setCameraActive(false); // turn off camera search upon matching code
      }
    }
  };

  const handleCameraError = (err: any) => {
    console.error("Kamera xatoligi:", err);
    setCameraError("Kameradan ruxsat olinmadi yoki u band bo'lishi mumkin. Sozlamalarni tekshiring.");
  };

  const handleSearchQR = async (code: string) => {
    if (!code.trim()) return;
    setSearching(true);
    setScanResult(null);
    setScanError(null);
    setSuccessMsg(null);
    setSelectedPlantIds([]);
    setIsDefect(false);
    setDefectImage(null);
    setNotes('');

    try {
      const result = await api.scanCode(code.trim());
      setScanResult(result);
      
      if (result.type === 'plant' && result.plant) {
        setTargetStage(result.plant.stage);
      } else if (result.type === 'batch' && result.plants) {
        // Pre-select all plants in batch by default
        const activeIds = result.plants.filter(p => p.stage !== 'defect' && p.stage !== 'sold').map(p => p.id);
        setSelectedPlantIds(activeIds);
        setTargetStage('cassette');
      }
    } catch (e: any) {
      setScanError(e.message || "Xatolik yuz berdi");
    } finally {
      setSearching(false);
    }
  };

  const handleSinglePlantStageSave = async () => {
    if (!scanResult || scanResult.type !== 'plant' || !scanResult.plant) return;
    setSearching(true);

    try {
      // Bosh agronom or admin approvals are auto-approved. Agronomist represents "pending" verification chain.
      const isAutoApproved = userRole === 'head_agronomist' || userRole === 'admin';
      
      await api.changePlantStage(scanResult.plant.id, {
        toStage: isDefect ? 'defect' : targetStage,
        changedBy: userId,
        notes: notes || "Skanerlash orqali yangilanish kiritildi",
        isDefect: isDefect || targetStage === 'defect',
        defectImage: isDefect ? defectImage : null,
        approvedByHead: isAutoApproved
      });

      setSuccessMsg(
        isAutoApproved 
          ? "Ko'chat yangi o'sish bosqichiga to'liq o'tkazildi!" 
          : "Bosqich o'zgartirish so'rovi muvaffaqiyatli saqlandi va Bosh agronom tasdiqlashiga yuborildi."
      );
      
      // Update details
      handleSearchQR(scanResult.plant.plant_code);
      fetchLists();
    } catch (e) {
      console.error(e);
      setScanError("Bosqich o'zgartirish amalga oshmadi.");
    } finally {
      setSearching(false);
    }
  };

  const handleMultiplePlantsStageSave = async () => {
    if (!scanResult || scanResult.type !== 'batch' || selectedPlantIds.length === 0) return;
    setSearching(true);

    try {
      const isAutoApproved = userRole === 'head_agronomist' || userRole === 'admin';
      
      await api.changeBatchPlantsStage(scanResult.batch.id, {
        plantIds: selectedPlantIds,
        toStage: isDefect ? 'defect' : targetStage,
        changedBy: userId,
        notes: notes || "Ko'p dona partiyalar uchun skanerdan guruhlangan yangilanish",
        isDefect: isDefect || targetStage === 'defect',
        defectImage: isDefect ? defectImage : null,
        approvedByHead: isAutoApproved
      });

      setSuccessMsg(
        isAutoApproved 
          ? `${selectedPlantIds.length} ta ko'chat o'g'itlanib, yangi bosqichga tasdiqlandi!` 
          : `${selectedPlantIds.length} ta ko'chat bosqich yangilanish so'rovi Bosh agronom tasdig'iga yuborildi.`
      );

      handleSearchQR(scanResult.batch.batch_code);
      fetchLists();
    } catch (e) {
      console.error(e);
      setScanError("Kollektiv bosqich almashtirish xatosi.");
    } finally {
      setSearching(false);
    }
  };

  const toggleCheckPlant = (id: number) => {
    if (selectedPlantIds.includes(id)) {
      setSelectedPlantIds(selectedPlantIds.filter(pid => pid !== id));
    } else {
      setSelectedPlantIds([...selectedPlantIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-150 pb-4">
        <h2 className="text-xl font-bold font-sans text-gray-900 flex items-center gap-1.5">
          <QrCode className="text-emerald-600 h-6 w-6" /> Agronom Skanerlash Moduli (Skaner Simulator)
        </h2>
        <p className="text-xs text-gray-500 font-sans">
          Flutter mobil APK ishlatuvining veb-simulyatori. QR stikerini skanserlash, bosqich o'zgartirish va nuqson belgilash tizimi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time simulation control card */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Scan className="text-emerald-600 h-5 w-5" /> QR Skanerlash
            </h3>

            {/* Input code simulation */}
            <div className="space-y-2">
              <label className="block text-gray-400 font-mono text-[9px] uppercase font-bold">QR Kodini kiriting yoki tanlang</label>
              <div className="flex gap-1">
                <input 
                  type="text" 
                  placeholder="Masalan, PLT-2026-001-0001"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchQR(qrInput)}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-mono outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <button 
                  onClick={() => handleSearchQR(qrInput)}
                  disabled={searching}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl border border-emerald-500 transition-all cursor-pointer flex items-center justify-center disabled:bg-gray-200"
                >
                  {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Live Camera Scanner Integration */}
            <div className="mt-4 pt-4 border-t border-gray-150">
              {cameraActive ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-emerald-950/20 p-2.5 border border-[#333333] select-none">
                    <span className="text-xs font-bold text-[#00FF00] font-mono flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#00FF00]"></span> KAMERA FAOL...
                    </span>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setFacingMode(facingMode === 'rear' ? 'front' : 'rear')}
                        className="text-[9px] font-mono bg-neutral-900 text-white border border-[#333333] font-bold px-2 py-1 rounded-none cursor-pointer hover:bg-white hover:text-black transition-colors"
                        title="Kamerani almashtirish (orqa/oldingi)"
                      >
                        KAMERA: {facingMode === 'rear' ? 'ORQA' : 'OLDIN'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setCameraActive(false);
                          setCameraError(null);
                        }}
                        className="text-[9px] font-mono bg-red-950/40 text-red-500 border border-red-900/40 px-2 py-1 rounded-none font-bold cursor-pointer hover:bg-red-650 hover:text-white transition-colors"
                      >
                        YOPISH
                      </button>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="bg-red-950/20 p-2.5 border border-red-900/40 text-red-400 text-[10.5px] font-mono">
                      Xato: {cameraError}
                    </div>
                  )}

                  <div className="relative overflow-hidden border-2 border-[#00FF00] bg-black aspect-video flex items-center justify-center rounded-none">
                    {/* Glowing scanning laser lines */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#00FF00] shadow-[0_0_10px_#00FF00] animate-bounce z-10 pointer-events-none"></div>
                    <div className="absolute inset-2 border border-white/10 pointer-events-none z-10"></div>
                    
                    <QrScanner
                      delay={300}
                      onError={handleCameraError}
                      onScan={handleScan}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      facingMode={facingMode}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono uppercase text-center">
                    Kamera oldiga QR kodni yaqinlashtiring
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCameraActive(true);
                    setCameraError(null);
                  }}
                  className="w-full bg-[#111111] hover:bg-[#00FF00] text-white hover:text-black border-2 border-[#333333] hover:border-transparent transition-all uppercase tracking-tight duration-200 font-bold text-xs py-3 px-3 rounded-none flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  <Camera className="h-4 w-4" /> Mobil kamera orqali QR skanerlash
                </button>
              )}
            </div>

            {/* Simulated Active label selections */}
            <div className="mt-4 pt-4 border-t border-gray-100/70 space-y-3">
              <span className="block text-gray-400 font-mono text-[9px] uppercase font-bold">Sinash uchun tayyor QRlar oqimi</span>
              
              {loadingLists ? (
                <div className="text-center font-mono py-6 text-[10px] text-gray-400">Yuklanmoqda...</div>
              ) : (
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                  {/* List Batches */}
                  <div>
                    <span className="block text-[10px] text-emerald-700 font-bold mb-1">Partiyalar (Boshqaruv):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {allBatches.map(b => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setQrInput(b.batch_code);
                            handleSearchQR(b.batch_code);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono text-[9px] px-2 py-1 rounded-sm border border-emerald-200 transition-all font-bold"
                        >
                          {b.batch_code}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List Seeds */}
                  <div>
                    <span className="block text-[10px] text-indigo-700 font-bold mb-1">Dona Ko'chat QR-lari:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {activePlants.slice(0, 8).map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setQrInput(p.plant_code);
                            handleSearchQR(p.plant_code);
                          }}
                          className="bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 border border-indigo-100 font-mono text-[9px] p-1.5 rounded-lg text-left transition-all"
                        >
                          <div className="font-bold">{p.plant_code}</div>
                          <div className="text-[8px] text-gray-400 font-sans uppercase">Hozir: {p.stage}</div>
                        </button>
                      ))}
                    </div>
                    {activePlants.length > 8 && (
                      <span className="text-[9px] text-gray-400 mt-1 block">Yana {activePlants.length - 8} ta dona stikerlari chop etilgan.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scan Results Layout & Interactive actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Error Prompt */}
          {scanError && (
            <div className="p-4 rounded-xl bg-red-50 text-red-900 border border-red-100 font-semibold text-xs text-center flex items-center justify-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" /> {scanError}
            </div>
          )}

          {/* Success Prompt */}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-100 font-semibold text-xs text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> {successMsg}
            </div>
          )}

          {/* Default Empty Screen */}
          {!scanResult && !searching && !scanError && (
            <div className="bg-slate-50/50 p-16 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2 font-mono">
              <Scan className="h-10 w-10 text-gray-300" />
              Skanerlash oynasi faol. Navbatdagilarni tahlil qilish uchun QR kodni skanerlang yoki chap tomondagi namunalarni bosing.
            </div>
          )}

          {searching && (
            <div className="p-24 text-center text-xs font-mono text-gray-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
              Tizim skaner kodini tekshirmoqda...
            </div>
          )}

          {/* SIMULATED RESULTS PANEL */}
          {scanResult && !searching && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              {/* Type 1: Single Plant results card */}
              {scanResult.type === 'plant' && scanResult.plant && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase tracking-wider block">Yagona Ko'chat topildi</span>
                      <h4 className="text-base font-bold text-gray-950 font-mono mt-0.5">{scanResult.plant.plant_code}</h4>
                    </div>
                    <span className="text-xs bg-indigo-50 font-semibold text-indigo-800 border border-indigo-150 rounded-xl px-2.5 py-0.5 font-mono">
                      Bosqich: {scanResult.plant.stage.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-gray-450 block font-mono text-[9px] uppercase">Partiya Kodu</span>
                      <span className="font-bold text-gray-800 font-mono">{scanResult.batch.batch_code}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-gray-450 block font-mono text-[9px] uppercase">Obyekt (Eshik)</span>
                      <span className="font-bold text-gray-800">
                        {locations.find(l => l.id === scanResult.plant.location_id)?.name}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-gray-450 block font-mono text-[9px] uppercase">Gibrid turi / Nav</span>
                      <span className="font-bold text-gray-800">
                        {plantTypes.find(t => t.id === scanResult.batch.plant_type_id)?.name} (
                        {varieties.find(v => v.id === scanResult.batch.variety_id)?.name})
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-gray-450 block font-mono text-[9px] uppercase">Hozirgi holat</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        {scanResult.plant.is_defect ? (
                          <span className="text-red-600">Nuqsonli</span>
                        ) : (
                          <span className="text-emerald-700">Barkamol parvarish</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-150 space-y-4">
                    <h5 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><FileText className="h-4 w-4 text-emerald-600" /> Rivojlanish bosqichini o'zgartirish</h5>
                    
                    {/* Action Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {(['cassette', 'grafting', 'seedling', 'ready', 'defect'] as PlantStage[]).map(st => {
                        let text = 'Kaseta';
                        if (st === 'grafting') text = 'Payvand';
                        if (st === 'seedling') text = 'Ko\'chat';
                        if (st === 'ready') text = 'Tayyor';
                        if (st === 'defect') text = 'Nuqson (Xavf)';

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setTargetStage(st);
                              if (st === 'defect') setIsDefect(true);
                              else setIsDefect(false);
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
                              targetStage === st || (st === 'defect' && isDefect)
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                            }`}
                          >
                            {text}
                          </button>
                        );
                      })}
                    </div>

                    {/* Defect sub-form */}
                    {(isDefect || targetStage === 'defect') && (
                      <div className="p-4 rounded-xl bg-red-50/50 border border-red-50 space-y-3 animate-in fade-in-50">
                        <span className="font-bold text-red-950 block text-xs flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-red-600" /> Nuqsonni tasvirlash so’rovi</span>
                        
                        <div>
                          <label className="block text-gray-400 text-[9px] uppercase font-bold mb-1 font-mono">Daraxt/O'g'it nuqson surati (Skaner kamerasidan yuklash)</label>
                          <div className="grid grid-cols-3 gap-2">
                            {defectMockImages.map(img => (
                              <button
                                key={img.title}
                                type="button"
                                onClick={() => setDefectImage(img.url)}
                                className={`p-2 rounded-lg border text-left bg-white font-sans text-[10px] relative transition-all ${
                                  defectImage === img.url ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img src={img.url} alt={img.title} className="w-full h-12 object-cover rounded-md mb-1" referrerPolicy="no-referrer" />
                                <span className="font-semibold block">{img.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold">Agronom Izohi / Jarayon qaydlari</label>
                      <input 
                        type="text"
                        placeholder="Ushbu bosqichga o'tish sababi yoki parvarish amallari haqida..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button 
                        onClick={handleSinglePlantStageSave}
                        disabled={searching}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer border border-emerald-500 shadow-xs transition-all disabled:bg-gray-200"
                      >
                        {userRole === 'head_agronomist' || userRole === 'admin' ? "Bosqichni darhol tasdiqlash" : "Tasdiqlash to'plamiga yuborish"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Type 2: GROUP BATCH results card */}
              {scanResult.type === 'batch' && scanResult.batch && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase tracking-wider block">Guruhlangan Partiya Topildi</span>
                      <h4 className="text-base font-bold text-gray-950 font-mono mt-0.5">{scanResult.batch.batch_code}</h4>
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-150 rounded-xl px-2.5 py-0.5 font-mono">
                      Faol donalar: {scanResult.batch.active_count} ta
                    </span>
                  </div>

                  {/* Multiselect Checkbox list */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold">Bosqichini o'zgartiradigan donalarni tanlang ({selectedPlantIds.length} ta hammasidan)</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const selectable = (scanResult.plants || []).filter((p: any) => p.stage !== 'defect' && p.stage !== 'sold').map((p: any) => p.id);
                            setSelectedPlantIds(selectable);
                          }}
                          className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Hamma faol
                        </button>
                        <button 
                          onClick={() => setSelectedPlantIds([])}
                          className="text-[9px] font-mono text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Hech qaysi
                        </button>
                      </div>
                    </div>

                    {/* Checkbox Grid wrapper */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[150px] overflow-y-auto pr-1 p-2 bg-slate-50/50 rounded-xl border border-gray-100 font-mono text-xs">
                      {(scanResult.plants || []).map((p: any) => {
                        const isDead = p.stage === 'defect' || p.stage === 'sold';
                        return (
                          <label 
                            key={p.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                              isDead ? 'opacity-40 bg-gray-100 cursor-not-allowed border-gray-150' :
                              selectedPlantIds.includes(p.id) ? 'bg-emerald-50 border-emerald-300' : 'bg-white hover:bg-slate-50 border-gray-200'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedPlantIds.includes(p.id)}
                              onChange={() => !isDead && toggleCheckPlant(p.id)}
                              disabled={isDead}
                              className="accent-emerald-600 rounded"
                            />
                            <div>
                              <span className="font-bold block text-[10px] text-gray-800">{p.plant_code}</span>
                              <span className="text-[8px] text-gray-450 block uppercase font-sans">Bosqich: {p.stage}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batch collective Actions */}
                  {selectedPlantIds.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 bg-emerald-50/20 p-4 rounded-xl space-y-4">
                      <span className="block text-gray-800 font-bold text-xs">Tanlangan {selectedPlantIds.length} ta ko'chast donasi uchun guruh amali</span>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {(['cassette', 'grafting', 'seedling', 'ready', 'defect'] as PlantStage[]).map(st => {
                          let text = 'Kasetaga o’tkaz';
                          if (st === 'grafting') text = 'Payvandlashga';
                          if (st === 'seedling') text = 'Ko\'chatga o’tkaz';
                          if (st === 'ready') text = 'Tayyor deb belgil';
                          if (st === 'defect') text = 'Nuqsonli qora barf';

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setTargetStage(st);
                                if (st === 'defect') setIsDefect(true);
                                else setIsDefect(false);
                              }}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer border ${
                                targetStage === st || (st === 'defect' && isDefect)
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                              }`}
                            >
                              {text}
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold">Ushbu guruh g'amxo'rligiga agronom izohi</label>
                        <input 
                          type="text"
                          placeholder="Foydali qaydlar kiritish barcha tanlangan donalarga yoziladi..."
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={handleMultiplePlantsStageSave}
                          disabled={searching}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer border border-emerald-500 shadow-xs transition-all disabled:bg-gray-200"
                        >
                          {userRole === 'head_agronomist' || userRole === 'admin' ? "Belgilanganlarni darhol tasdiqlash" : "Guruh bosqichini tasdiqlash uchun yuborish"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
