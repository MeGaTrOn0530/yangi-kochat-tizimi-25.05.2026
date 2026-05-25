import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety, GraftType, Batch, Plant } from '../types';
import { Plus, Printer, Eye, X, Leaf, HelpCircle, Check, RefreshCw } from 'lucide-react';

interface BatchesTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  graftTypes: GraftType[];
  userId: number;
}

export default function BatchesTab({ locations, plantTypes, varieties, graftTypes, userId }: BatchesTabProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlantType, setSelectedPlantType] = useState<number>(0);
  const [selectedVariety, setSelectedVariety] = useState<number>(0);
  const [selectedGraftType, setSelectedGraftType] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(10);
  const [notes, setNotes] = useState('');
  
  // View Details Modal
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [viewingPlants, setViewingPlants] = useState<Plant[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [showQrPrintView, setShowQrPrintView] = useState(false);

  // X-Print Modal States
  const [xPrintBatch, setXPrintBatch] = useState<Batch | null>(null);
  const [xPrintPlants, setXPrintPlants] = useState<Plant[]>([]);
  const [loadingXPrint, setLoadingXPrint] = useState(false);
  const [printMode, setPrintMode] = useState<'all' | 'single'>('all'); // all = group (batch + plants), single = select
  const [selectedPlantIdsToPrint, setSelectedPlantIdsToPrint] = useState<number[]>([]);

  const handleXPrint = async (batch: Batch) => {
    setXPrintBatch(batch);
    setLoadingXPrint(true);
    setXPrintPlants([]);
    try {
      const plants = await api.getBatchPlants(batch.id);
      setXPrintPlants(plants);
      setSelectedPlantIdsToPrint(plants.map(p => p.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingXPrint(false);
    }
  };

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlantType || !selectedVariety || !selectedLocation || !totalCount) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    try {
      await api.createBatch({
        plant_type_id: Number(selectedPlantType),
        variety_id: Number(selectedVariety),
        graft_type_id: selectedGraftType ? Number(selectedGraftType) : null,
        location_id: Number(selectedLocation),
        total_count: Number(totalCount),
        notes,
        created_by: userId
      });
      setShowCreateModal(false);
      
      // Reset
      setSelectedPlantType(0);
      setSelectedVariety(0);
      setSelectedGraftType(null);
      setSelectedLocation(0);
      setTotalCount(10);
      setNotes('');
      
      fetchBatches();
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi");
    }
  };

  const handleViewBatch = async (batch: Batch) => {
    setViewingBatch(batch);
    setViewingPlants([]);
    setLoadingPlants(true);
    setShowQrPrintView(false);
    try {
      const plants = await api.getBatchPlants(batch.id);
      setViewingPlants(plants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlants(false);
    }
  };

  const activeVarieties = varieties.filter(v => v.plant_type_id === Number(selectedPlantType));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900">Urug' & Ko'chat Partiyalari (Batches)</h2>
          <p className="text-xs text-gray-500">Tizimga kiritilgan partiyalar tarixi va ularga tegishli QR kodlar.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Yangi Partiya Qo'shish
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Yuklanmoqda...
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 font-mono text-xs">
          Ayni vaqtda hech qanday partiyalar yaratilmagan.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Partiya Kodu</th>
                <th className="py-3 px-4">Nomi / Navli</th>
                <th className="py-3 px-4">Lokatsiyasi</th>
                <th className="py-3 px-4">Soni (Tirik / Jami)</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4">Sana</th>
                <th className="py-3 px-4 text-center">Batafsil / QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {batches.map(batch => {
                const type = plantTypes.find(p => p.id === batch.plant_type_id);
                const variety = varieties.find(v => v.id === batch.variety_id);
                const loc = locations.find(l => l.id === batch.location_id);
                
                let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                let displayedStatus = 'Jarayonda';
                if (batch.status === 'ready') {
                  badgeClass = 'bg-emerald-100 text-emerald-850 border-emerald-250';
                  displayedStatus = 'Sotuvga Tayyor';
                } else if (batch.status === 'sold') {
                  badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                  displayedStatus = 'Sotilgan';
                } else if (batch.status === 'archived') {
                  badgeClass = 'bg-gray-100 text-gray-600 border-gray-250';
                  displayedStatus = 'Arxivlangan';
                }

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-4 font-mono font-bold text-gray-900">{batch.batch_code}</td>
                    <td className="py-4 px-4 font-sans font-medium text-gray-800">
                      <div>{type?.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{variety?.name} {batch.graft_type_id ? `(Payvand)` : ''}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-sans">{loc?.name}</td>
                    <td className="py-4 px-4 font-mono text-gray-800">
                      <span className="font-bold text-emerald-600">{batch.active_count}</span>
                      <span className="text-gray-300 mx-1">/</span>
                      <span className="text-gray-400">{batch.total_count} ta</span>
                      {batch.defect_count > 0 && (
                        <span className="ml-2 text-red-500 bg-red-50 text-[10px] px-1.5 py-0.5 rounded-full">-{batch.defect_count} nuqson</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {displayedStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 font-mono">{new Date(batch.created_at).toLocaleDateString('uz-UZ')}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex gap-1.5 justify-center">
                        <button 
                          onClick={() => handleViewBatch(batch)}
                          className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 p-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all border border-emerald-250 dark:border-emerald-800/30"
                        >
                          <Eye className="h-3.5 w-3.5" /> <span className="text-[10px] font-mono font-bold">Batafsil</span>
                        </button>
                        <button 
                          onClick={() => handleXPrint(batch)}
                          className="bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 p-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all border border-sky-250 dark:border-sky-800/30"
                          title="Dastlab partiyaning QR kodi, so'ng har bir donaning QR kodi (X-Print)"
                        >
                          <Printer className="h-3.5 w-3.5" /> <span className="text-[10px] font-mono font-bold">X-Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL: Create Batch --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-sans text-gray-900 mb-2">Yangi ko'chat partiyasini ro’yxatga olish</h3>
            <p className="text-xs text-gray-500 mb-4 font-sans">Ushbu jarayonda har bir ko'chat uchun avtomatik QR-kodlar yaratiladi.</p>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Ko'chat turi *</label>
                  <select 
                    value={selectedPlantType} 
                    onChange={e => {
                      setSelectedPlantType(Number(e.target.value));
                      setSelectedVariety(0);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {plantTypes.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Nav (Variety) *</label>
                  <select 
                    value={selectedVariety} 
                    onChange={e => setSelectedVariety(Number(e.target.value))}
                    disabled={!selectedPlantType}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {activeVarieties.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Payvandlash usuli (Ixtiyoriy)</label>
                  <select 
                    value={selectedGraftType || 0} 
                    onChange={e => setSelectedGraftType(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0}>Payvandlanmagan (Oddiy)</option>
                    {graftTypes.map(gt => (
                      <option key={gt.id} value={gt.id}>{gt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Ekadigan ob'ekt (Lokatsiya) *</label>
                  <select 
                    value={selectedLocation} 
                    onChange={e => setSelectedLocation(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} (Sig'im: {loc.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Jami o'simlik / Urug' donasi soni *</label>
                <input 
                  type="number" 
                  min={1} 
                  max={100} 
                  value={totalCount} 
                  onChange={e => setTotalCount(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden text-right font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Yaratish chegarasi bir vaqtda 100 donagacha cheklangan (QR yuklama tufayli).</span>
              </div>

              <div>
                <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Partiyaga ixtiyoriy izoh/eslatma</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Masalan, Fevral oyi uchun mo'ljallangan birinchi parvarish"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-gray-150 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 font-semibold rounded-xl border border-emerald-500 transition-all cursor-pointer"
                >
                  Urug'larni yaratish va QR chop etish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: View Batch & Plants QR printed view --- */}
      {viewingBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Leaf className="text-emerald-600" /> Partiya: {viewingBatch.batch_code}
                </h3>
                <p className="text-xs text-gray-500">Ushbu partiyadagi alohida ko'chat donalari va ularga biriktirilgan stikerlar.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowQrPrintView(!showQrPrintView)}
                  className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="h-4 w-4" /> {showQrPrintView ? "Donalar Ro'yxati" : "QR Stiker Chop Etish"}
                </button>
                <button 
                  onClick={() => setViewingBatch(null)}
                  className="p-1 px-1.5 border border-gray-200 text-gray-400 hover:text-gray-600 rounded-xl cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingPlants ? (
                <div className="py-24 text-center text-xs ml-auto mr-auto font-mono text-gray-400">
                  QR stikerlar yuklanmoqda...
                </div>
              ) : showQrPrintView ? (
                /* PRINT STICKERS SIMULATOR */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 text-amber-950 text-xs flex items-start gap-2 max-w-2xl border border-amber-100">
                    <HelpCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold block">Chop etish ma'lumoti:</span>
                      Siz bu yerdagi stikerlarni printer orqali to’g’ridan-to'g'ri maxsus stiker qog'oziga chiqarib, har bir ko'chat tasmalariga yoki kasetasiga yopishtirushingiz mumkin.
                    </div>
                  </div>

                  {/* Stickers Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="printed-scanners">
                    {/* General Batch QR */}
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-emerald-300 relative text-center flex flex-col items-center justify-between shadow-xs">
                      <span className="absolute top-1.5 left-2 bg-emerald-600 text-white font-mono uppercase text-[8px] font-bold px-1.5 py-0.5 rounded-full">UMUMIY PARTIYA</span>
                      <img src={viewingBatch.qr_code} alt="Batch QR" className="w-24 h-24 mb-2 object-contain mt-4" referrerPolicy="no-referrer" />
                      <div className="text-center">
                        <span className="font-mono font-bold text-gray-900 block text-xs">{viewingBatch.batch_code}</span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">Urug'lar To'plami ({viewingBatch.total_count} dona)</span>
                      </div>
                    </div>

                    {/* Plant QR sticker list */}
                    {viewingPlants.map((plt, idx) => (
                      <div key={plt.id} className="bg-white p-3 rounded-xl border border-gray-200 relative text-center flex flex-col items-center justify-between hover:border-gray-300 transition-all shadow-xs">
                        <span className="absolute top-1.5 right-2 bg-gray-100 text-gray-500 font-mono text-[8px] font-bold px-1 px-0.5 rounded">#{idx + 1}</span>
                        <img src={plt.qr_code} alt="Plant QR" className="w-20 h-20 mb-2 object-contain mt-3" referrerPolicy="no-referrer" />
                        <div>
                          <span className="font-mono font-bold text-gray-800 text-[10px] block">{plt.plant_code}</span>
                          <span className="text-[8px] uppercase tracking-wider font-bold bg-amber-50 rounded text-amber-600 p-0.5 mt-1 inline-block font-mono leading-none">
                            {plt.stage === 'cassette' ? 'KASETA' : plt.stage === 'grafting' ? 'PAYVAND' : plt.stage === 'seedling' ? 'KO\'CHAT' : plt.stage === 'ready' ? 'TAYYOR' : 'NOMA\'LUM'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* PLANT ITEMS DETAILS LIST */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Partiya Kodu</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">{viewingBatch.batch_code}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Eshik o'rni</span>
                      <span className="font-sans font-bold text-gray-900 text-sm">
                        {locations.find(l => l.id === viewingBatch.location_id)?.name}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Tiriklar Soni</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        {viewingBatch.active_count} / {viewingBatch.total_count} ta
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Yaratilgan Sana</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {new Date(viewingBatch.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-100 font-mono text-gray-400 uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-4 text-center">T/r</th>
                          <th className="py-2.5 px-4">Dona Kodu (ID)</th>
                          <th className="py-2.5 px-4">Faol Katta-Kichik Bosqichi</th>
                          <th className="py-2.5 px-4">Nuqson bormi?</th>
                          <th className="py-2.5 px-4 text-center">Asosiy Tasdiq</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-sans">
                        {viewingPlants.map((plt, idx) => (
                          <tr key={plt.id} className="hover:bg-slate-50/20">
                            <td className="py-3 px-4 text-center text-gray-400 font-mono">#{idx+1}</td>
                            <td className="py-3 px-4 font-mono font-bold text-gray-800">{plt.plant_code}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                                plt.stage === 'cassette' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                                plt.stage === 'grafting' ? 'bg-amber-50 text-amber-700 border-amber-150' :
                                plt.stage === 'seedling' ? 'bg-teal-50 text-teal-700 border-teal-150' :
                                plt.stage === 'ready' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                                plt.stage === 'defect' ? 'bg-red-50 text-red-700 border-red-150' :
                                'bg-gray-50 text-gray-600 border-gray-150'
                              }`}>
                                {plt.stage === 'cassette' ? 'Kaseta' : plt.stage === 'grafting' ? 'Payvandlash' : plt.stage === 'seedling' ? 'Ko\'chat' : plt.stage === 'ready' ? 'Tayyor' : plt.stage === 'defect' ? 'Nuqson' : plt.stage === 'sold' ? 'Sotilgan' : plt.stage}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-sans">
                              {plt.is_defect ? (
                                <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-mono border border-red-100">Nuqson bor</span>
                              ) : (
                                <span className="text-emerald-600 flex items-center gap-1 font-mono text-[10px] font-bold"><Check className="h-3.5 w-3.5" /> Barkamol</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-400 font-mono text-[10px]">
                              {plt.stage === 'sold' ? 'Bugalterda tasdiqdangan' : 'Skanerlash orqali bosqich uzatish'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-slate-50 flex items-center justify-end">
              <button 
                onClick={() => setViewingBatch(null)}
                className="bg-gray-900 text-white hover:bg-gray-850 px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: X-Print Premium Label System (Group or Individual QRs) --- */}
      {xPrintBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Include printable specific style override */}
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              /* Hide all components outer layer */
              #root, .fixed, .bg-black\\/60, aside, main, header, nav {
                visibility: hidden !important;
                display: none !important;
              }
              /* Show printable element exclusively */
              #x-print-printable-area-wrapper {
                visibility: visible !important;
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              #x-print-printable-area-wrapper * {
                visibility: visible !important;
              }
              .page-break-after {
                page-break-after: always !important;
                break-after: page !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-zinc-200 dark:border-[#222222] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in-50 zoom-in-95 no-print">
            <div className="p-5 border-b border-gray-150 dark:border-[#222222] flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/45 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Printer className="text-sky-500" /> X-Print™: QR va Markalar Chop Etish Tizimi
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono mt-0.5">
                  Partiya: <span className="font-bold text-sky-500">{xPrintBatch.batch_code}</span> | 
                  Ekin: <span className="text-zinc-700 dark:text-zinc-300 font-bold">{plantTypes.find(p => p.id === xPrintBatch.plant_type_id)?.name} ({varieties.find(v => v.id === xPrintBatch.variety_id)?.name})</span>
                </p>
              </div>
              <button 
                onClick={() => setXPrintBatch(null)}
                className="p-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#080808] grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Side: Controls & Selector list */}
              <div className="md:col-span-5 space-y-4 font-sans text-xs flex flex-col">
                <div className="bg-white dark:bg-[#151515] p-4 rounded-xl border border-zinc-150 dark:border-[#222222] space-y-3 shadow-xs">
                  <span className="block text-zinc-400 uppercase font-mono text-[9px] font-bold tracking-wider">1. Chop etish turini tanlang</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setPrintMode('all');
                        setSelectedPlantIdsToPrint(xPrintPlants.map(p => p.id));
                      }}
                      className={`py-2 px-3 rounded-lg border text-center font-bold font-sans transition-all cursor-pointer ${
                        printMode === 'all'
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      📦 Guruppaviy (Hamkorlikda)
                    </button>
                    <button
                      onClick={() => {
                        setPrintMode('single');
                        setSelectedPlantIdsToPrint([]);
                      }}
                      className={`py-2 px-3 rounded-lg border text-center font-bold font-sans transition-all cursor-pointer ${
                        printMode === 'single'
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      🌱 Donali (Yakka / Erkin)
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    {printMode === 'all' 
                      ? "Avval partiyaning bosh QR kodi, so'ngra qatorasiga jami barcha individual donalar kodi bitta listga jo'natiladi." 
                      : "Ro'yxatdan faqat o'zingizga kerakli bo'lgan muayyan o'simlik donasining QR kodlarini tanlab chiqaring."}
                  </p>
                </div>

                {/* Plant table checklist */}
                <div className="bg-white dark:bg-[#151515] rounded-xl border border-zinc-150 dark:border-[#222222] overflow-hidden flex-1 flex flex-col min-h-[220px] max-h-[350px] shadow-xs">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-[#222222] flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold uppercase text-zinc-500">Chop etiluvchi donalar ro'yxati</span>
                    {printMode === 'single' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedPlantIdsToPrint(xPrintPlants.map(p => p.id))}
                          className="text-[8px] uppercase tracking-wide bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-850 cursor-pointer font-bold"
                        >
                          Barchasini tanlash
                        </button>
                        <button
                          onClick={() => setSelectedPlantIdsToPrint([])}
                          className="text-[8px] uppercase tracking-wide bg-zinc-100 dark:bg-[#222] text-zinc-500 px-1.5 py-0.5 rounded cursor-pointer font-bold"
                        >
                          Tozalash
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-zinc-100 dark:divide-zinc-850">
                    {loadingXPrint ? (
                      <div className="p-6 text-center text-zinc-400 font-mono text-[10px]">Yuklanmoqda...</div>
                    ) : xPrintPlants.length === 0 ? (
                      <div className="p-6 text-center text-zinc-400 font-mono text-[10px]">O'simliklar mavjud emas</div>
                    ) : (
                      xPrintPlants.map((plt, idx) => {
                        const isChecked = selectedPlantIdsToPrint.includes(plt.id);
                        return (
                          <div 
                            key={plt.id}
                            onClick={() => {
                              if (printMode === 'all') return;
                              setSelectedPlantIdsToPrint(prev => 
                                prev.includes(plt.id) ? prev.filter(id => id !== plt.id) : [...prev, plt.id]
                              );
                            }}
                            className={`p-2.5 flex items-center justify-between text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-all ${
                              printMode === 'all' ? 'opacity-80' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {printMode === 'single' ? (
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {}} // Handled by outer div onClick
                                  className="h-3.5 w-3.5 rounded text-sky-500 focus:ring-sky-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                                />
                              ) : (
                                <span className="text-[10px] text-zinc-405 font-mono">#{idx + 1}</span>
                              )}
                              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{plt.plant_code}</span>
                            </div>
                            <span className={`text-[8.5px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                              plt.stage === 'cassette' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30' :
                              plt.stage === 'grafting' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30' :
                              plt.stage === 'seedling' ? 'bg-teal-50 border-teal-100 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30' :
                              'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                            }`}>
                              {plt.stage === 'cassette' ? 'Kaseta' : plt.stage === 'grafting' ? 'Payvand' : plt.stage === 'seedling' ? 'Ko\'chat' : 'Tayyor'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Visual Thermal Roller Simulation Sticky */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 dark:text-zinc-500 uppercase font-mono text-[9px] font-bold tracking-wider">2. Termo-kasseta / Stikerlar roligi simulyatori</span>
                    <span className="text-zinc-500 font-mono text-[9px]">Chop etiluvchi: <strong className="text-sky-500">{printMode === 'all' ? selectedPlantIdsToPrint.length + 1 : selectedPlantIdsToPrint.length} dona</strong></span>
                  </div>

                  {/* Visual Roller Area */}
                  <div className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-[#2d2d2d] rounded-2xl p-6 overflow-y-auto max-h-[460px] flex flex-col items-center gap-4 shadow-inner">
                    {/* Visual Roller Tape Header */}
                    <div className="w-full h-2.5 bg-zinc-300 dark:bg-zinc-950 rounded-full shrink-0 border-b border-white/10" />

                    {/* Dynamic previews aligned consecutively inside the Tape */}
                    {printMode === 'all' && (
                      <div className="bg-white text-zinc-950 w-full max-w-[290px] p-5 rounded-md border border-zinc-300 shadow-[0_4px_10px_rgba(0,0,0,0.15)] text-center relative flex flex-col items-center">
                        <div className="absolute top-1.5 left-2 bg-emerald-600 text-white font-mono uppercase text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-full">BOSH PARTIYA STIKERI</div>
                        <img src={xPrintBatch.qr_code} alt="Batch QR" className="w-24 h-24 mb-2 object-contain mt-3 p-1 border border-zinc-100 rounded" referrerPolicy="no-referrer" />
                        <div className="text-center font-sans">
                          <span className="font-mono font-black text-gray-900 block text-[13px] tracking-wide">{xPrintBatch.batch_code}</span>
                          <span className="text-[9px] text-zinc-500 font-bold block mt-1 uppercase text-emerald-600">{plantTypes.find(p => p.id === xPrintBatch.plant_type_id)?.name} ({varieties.find(v => v.id === xPrintBatch.variety_id)?.name})</span>
                          <span className="text-[8.5px] text-zinc-400 block mt-0.5 font-mono">Barcha ko'chatlar: {xPrintBatch.total_count} dona</span>
                        </div>
                        {/* Roller cut dashes line simulation */}
                        <div className="absolute -bottom-2.5 left-0 right-0 border-t border-dashed border-zinc-400 text-zinc-400 text-[8px] font-mono select-none">====================</div>
                      </div>
                    )}

                    {selectedPlantIdsToPrint.length === 0 ? (
                      <div className="text-center py-20 text-zinc-400 dark:text-zinc-500 text-[11px] font-mono">
                        Chop etish uchun birorta dona ko'chatni tanlang!
                      </div>
                    ) : (
                      xPrintPlants
                        .filter(plt => selectedPlantIdsToPrint.includes(plt.id))
                        .map((plt, idx) => (
                          <div key={plt.id} className="bg-white text-zinc-950 w-full max-w-[290px] p-4 rounded-md border border-zinc-300 shadow-[0_4px_10px_rgba(0,0,0,0.15)] text-center relative flex flex-col items-center justify-between">
                            <span className="absolute top-1.5 right-2 bg-gray-100 text-gray-500 font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm">X-DONA {idx + 1}</span>
                            <img src={plt.qr_code} alt="Plant QR" className="w-20 h-20 mb-2 object-contain mt-2.5 p-1 border border-zinc-100 rounded" referrerPolicy="no-referrer" />
                            <div className="text-center font-sans w-full">
                              <span className="font-mono font-bold text-zinc-900 block text-[11px]">{plt.plant_code}</span>
                              <div className="flex justify-between items-center text-[8.5px] text-zinc-500 bg-zinc-50 p-1 border border-zinc-100 rounded-md mt-1.5 mx-2 font-mono uppercase">
                                <span className="font-bold">{plt.stage === 'cassette' ? 'Kaseta' : plt.stage === 'grafting' ? 'Payvand' : plt.stage === 'seedling' ? 'Ko\'chat' : 'Tayyor'}</span>
                                <span className="opacity-80">Row: {xPrintBatch.batch_code}</span>
                              </div>
                            </div>
                            {/* Roller cut dashes line simulation */}
                            <div className="absolute -bottom-2.5 left-0 right-0 border-t border-dashed border-zinc-400 text-zinc-400 text-[8px] font-mono select-none">====================</div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-400/20 text-sky-850 dark:text-sky-400 rounded-xl leading-relaxed text-[10px] space-y-1 font-sans">
                  <span className="font-bold uppercase block text-sky-600 dark:text-sky-305">🖨️ Printer Konfiguratori:</span>
                  Tizim har qanday termosublimatsiyali stiker printerlariga moslashadi (58mm x 40mm standard o'lchamga optimallashtirilgan). Haqiqiy chop etish uchun pastdagi "Chop Etish" tugmasini bosing va print darchasini oching.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-150 dark:border-[#222222] bg-zinc-50 dark:bg-zinc-900/40 rounded-b-2xl flex items-center justify-between">
              <button 
                onClick={() => setXPrintBatch(null)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850 text-xs font-bold transition-all cursor-pointer"
              >
                Bekor Qilish
              </button>

              <button 
                onClick={() => {
                  if (printMode === 'single' && selectedPlantIdsToPrint.length === 0) {
                    alert("Iltimos, avvalo bitta yoki undan ko'p ko'chat donasini tanlang!");
                    return;
                  }
                  setTimeout(() => {
                    window.print();
                  }, 200);
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl border border-sky-500 shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="h-4 w-4" /> Barcha Markalarni Chop Etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HIDDEN WRAPPER STRICTLY FOR PHYSICAL PRINT STYLES --- */}
      <div id="x-print-printable-area-wrapper" className="hidden">
        {xPrintBatch && (
          <div className="bg-white text-zinc-950 p-0 m-0 flex flex-col items-center justify-center font-sans">
            {/* 1. Main Batch QR */}
            {printMode === 'all' && (
              <div className="w-[180px] h-[180px] p-0 m-0 flex items-center justify-center page-break-after mx-auto">
                <img src={xPrintBatch.qr_code} alt="Batch QR Code" className="w-[170px] h-[170px] m-0 p-0 object-contain block" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* 2. Plant sequence QR list */}
            {xPrintPlants
              .filter(plt => selectedPlantIdsToPrint.includes(plt.id))
              .map((plt) => (
                <div key={plt.id} className="w-[180px] h-[180px] p-0 m-0 flex items-center justify-center page-break-after mx-auto">
                  <img src={plt.qr_code} alt="Plant QR Code" className="w-[170px] h-[170px] m-0 p-0 object-contain block" referrerPolicy="no-referrer" />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
