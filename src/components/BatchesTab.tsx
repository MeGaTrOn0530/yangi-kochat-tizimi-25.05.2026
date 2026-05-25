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
                      <button 
                        onClick={() => handleViewBatch(batch)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-150 p-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" /> <span className="text-[10px] font-mono font-bold">QR / Ko'rish</span>
                      </button>
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
    </div>
  );
}
