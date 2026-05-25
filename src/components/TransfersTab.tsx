import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety, Transfer, Plant } from '../types';
import { ArrowRightLeft, Plus, Check, X, Truck, CheckCircle2, RefreshCw } from 'lucide-react';

interface TransfersTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  userId: number;
  userRole: string;
}

export default function TransfersTab({ locations, plantTypes, varieties, userId, userRole }: TransfersTabProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [fromLoc, setFromLoc] = useState<number>(0);
  const [toLoc, setToLoc] = useState<number>(0);
  const [plantType, setPlantType] = useState<number>(0);
  const [variety, setVariety] = useState<number>(0);
  const [stage, setStage] = useState<string>('ready');
  const [qty, setQty] = useState<number>(5);
  const [notes, setNotes] = useState('');

  // Skanerlash simulation on Dispatch / Receive
  const [processingTransfer, setProcessingTransfer] = useState<Transfer | null>(null);
  const [transferPlantsPool, setTransferPlantsPool] = useState<Plant[]>([]);
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);
  const [scanningActionType, setScanningActionType] = useState<'dispatch' | 'receive' | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await api.getTransfers();
      setTransfers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleRequestTransfer = async (e: FormEvent) => {
    e.preventDefault();
    if (!fromLoc || !toLoc || !plantType || !variety || !qty) {
      alert("Majburiy o'zgaruvchilar tanlanmagan.");
      return;
    }

    if (fromLoc === toLoc) {
      alert("Manba va maqsad bir xil bo'la olmaydi!");
      return;
    }

    try {
      await api.createTransfer({
        from_location: Number(fromLoc),
        to_location: Number(toLoc),
        plant_type_id: Number(plantType),
        variety_id: Number(variety),
        stage,
        quantity: Number(qty),
        requested_by: userId,
        notes
      });
      setShowRequestModal(false);
      setFromLoc(0);
      setToLoc(0);
      setPlantType(0);
      setVariety(0);
      setQty(5);
      setNotes('');
      fetchTransfers();
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi");
    }
  };

  const handleApprove = async (id: number, approve: boolean) => {
    try {
      if (approve) {
        await api.approveTransfer(id, userId);
      } else {
        await api.rejectTransfer(id, userId);
      }
      fetchTransfers();
    } catch (e) {
      console.error(e);
    }
  };

  const startDispatchOrReceive = async (transfer: Transfer, type: 'dispatch' | 'receive') => {
    setProcessingTransfer(transfer);
    setScanningActionType(type);
    setSelectedPlantIds([]);
    
    // Find matching plant inventory currently at sources matching parameters
    try {
      // Fetch pool: We list ALL plants present in source location of matching type & variety & stage
      const batches = await api.getBatches({ location_id: transfer.from_location });
      let pool: Plant[] = [];
      for (const b of batches) {
        if (b.plant_type_id === transfer.plant_type_id && b.variety_id === transfer.variety_id) {
          const bp = await api.getBatchPlants(b.id);
          pool = [...pool, ...bp.filter(p => p.stage === transfer.stage && !p.is_defect)];
        }
      }
      setTransferPlantsPool(pool);
      // Auto select first 'quantity' matching plants for visual comfort
      setSelectedPlantIds(pool.slice(0, transfer.quantity).map(p => p.id));
    } catch (e) {
      console.error(e);
    }
  };

  const executeDispatch = async () => {
    if (!processingTransfer) return;
    if (selectedPlantIds.length !== processingTransfer.quantity) {
      alert(`Iltimos, so'ralgan miqdorda (${processingTransfer.quantity} ta) ko'chat stikerlarini skanerlang.`);
      return;
    }

    try {
      await api.sendTransfer(processingTransfer.id, {
        sentBy: userId,
        plantIds: selectedPlantIds
      });
      setProcessingTransfer(null);
      setScanningActionType(null);
      fetchTransfers();
    } catch (e) {
      console.error(e);
    }
  };

  const executeReceive = async () => {
    if (!processingTransfer) return;
    if (selectedPlantIds.length !== processingTransfer.quantity) {
      alert(`Maqsadli agronom barcha (${processingTransfer.quantity} ta) jo'natilgan ko'chatlarni skanerlashi shart.`);
      return;
    }

    try {
      await api.receiveTransfer(processingTransfer.id, {
        receivedBy: userId,
        plantIds: selectedPlantIds
      });
      setProcessingTransfer(null);
      setScanningActionType(null);
      fetchTransfers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900">Lokatsiyalararo Transferlar (Transfers)</h2>
          <p className="text-xs text-gray-500 font-sans">Issiqxonalar va ochiq dalalar o’rtasida ko'chat ko'chirish so'rovlari va skanerlash tarixi.</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Transfer So'rovi
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Yuklanmoqda...
        </div>
      ) : transfers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 font-mono text-xs">
          Hech qanday transfer so'rovlari mavjud emas.
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map(tr => {
            const from = locations.find(l => l.id === tr.from_location);
            const to = locations.find(l => l.id === tr.to_location);
            const type = plantTypes.find(pt => pt.id === tr.plant_type_id);
            const variety = varieties.find(v => v.id === tr.variety_id);
            
            let badgeStyle = 'bg-amber-100 border-amber-200 text-amber-800';
            let displayedStatus = 'Kutilmoqda';

            if (tr.status === 'approved') {
              badgeStyle = 'bg-emerald-50 border-emerald-150 text-emerald-850';
              displayedStatus = 'Tasdiqlandi (Jo’natish kutilmoqda)';
            } else if (tr.status === 'in_transit') {
              badgeStyle = 'bg-sky-50 border-sky-150 text-sky-850';
              displayedStatus = "Yo'lda (Tranzit)";
            } else if (tr.status === 'completed') {
              badgeStyle = 'bg-slate-100 border-slate-200 text-slate-900';
              displayedStatus = "Yakunlandi";
            } else if (tr.status === 'rejected') {
              badgeStyle = 'bg-red-50 border-red-150 text-red-700';
              displayedStatus = "Rad etilgan";
            }

            return (
              <div key={tr.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-gray-900">{from?.name}</span>
                    <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-bold">{to?.name}</span>
                  </div>

                  <div className="font-sans font-medium text-gray-800 text-[13px]">
                    {type?.name} ({variety?.name}) • <span className="font-mono text-emerald-600 font-bold">{tr.quantity} ta ko'chat</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 max-w-sm text-[10px] text-gray-400 font-mono">
                    <span>O'sish bosqichi: {tr.stage.toUpperCase()}</span>
                    <span>Sana: {new Date(tr.created_at).toLocaleDateString('uz-UZ')}</span>
                  </div>

                  {tr.notes && (
                    <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-gray-600 italic leading-relaxed">
                      " {tr.notes} "
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-center gap-2">
                  <span className={`inline-block text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                    {displayedStatus}
                  </span>

                  {/* Actions according to Role Permission */}
                  <div className="flex gap-1">
                    {/* 1. Head Agronomist approves/rejects */}
                    {tr.status === 'pending' && (userRole === 'head_agronomist' || userRole === 'admin') && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleApprove(tr.id, false)}
                          className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Rad etish
                        </button>
                        <button 
                          onClick={() => handleApprove(tr.id, true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Tasdiqlash
                        </button>
                      </div>
                    )}

                    {/* 2. Donor agronom dispatches plants (QR sticker scanning simul) */}
                    {tr.status === 'approved' && userRole === 'agronomist' && (
                      <button 
                        onClick={() => startDispatchOrReceive(tr, 'dispatch')}
                        className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Truck className="h-3.5 w-3.5" /> Skanerlab jo'natish (Dispatch)
                      </button>
                    )}

                    {/* 3. Recipient agronom receives plants */}
                    {tr.status === 'in_transit' && userRole === 'agronomist' && (
                      <button 
                        onClick={() => startDispatchOrReceive(tr, 'receive')}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-500 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Skanerlab qabul qilish (Receive)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL: Create Transfer Request --- */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in-50">
            <button 
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-sans text-gray-900 mb-1">Ko'chat transfer so'rovi</h3>
            <p className="text-xs text-gray-500 mb-4 font-sans">Belgilangan ob'ektlar o’rtasida parvarish almashinuvi yuklamasi.</p>

            <form onSubmit={handleRequestTransfer} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Qaysi ob'ektdan (Manba) *</label>
                  <select 
                    value={fromLoc} 
                    onChange={e => setFromLoc(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Maqsadli ob'ektga (Qabul qiluvchi) *</label>
                  <select 
                    value={toLoc} 
                    onChange={e => setToLoc(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Ko'chat turi *</label>
                  <select 
                    value={plantType} 
                    onChange={e => {
                      setPlantType(Number(e.target.value));
                      setVariety(0);
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
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Navli *</label>
                  <select 
                    value={variety} 
                    onChange={e => setVariety(Number(e.target.value))}
                    disabled={!plantType}
                    className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {varieties.filter(v => v.plant_type_id === plantType).map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Parvarish bosqichi</label>
                  <select 
                    value={stage} 
                    onChange={e => setStage(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="cassette">Kaseta</option>
                    <option value="grafting">Payvand</option>
                    <option value="seedling">Ko'chat</option>
                    <option value="ready">Sotuvga tayyor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Transfer miqdori (Soni) *</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={qty} 
                    onChange={e => setQty(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden tracking-wider font-mono text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Izoh/Ehtiyoj sababi</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Zarurat yoki ko'chirish sababi haqida eslatma..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-gray-150 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl border border-emerald-500 cursor-pointer transition-all"
                >
                  So'rov yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: SCAN TRANSFERS PROCESSOR (Dispatch / Receive) --- */}
      {processingTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in-50">
            <button 
              onClick={() => {
                setProcessingTransfer(null);
                setScanningActionType(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold font-sans text-gray-900 mb-1 flex items-center gap-1.5">
              <Truck className="text-emerald-650" /> {scanningActionType === 'dispatch' ? "Chiqarish / Jo'natish Skanerlashi" : "Qabul qilish Skanerlashi"}
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-sans">
              Partiyadagi {processingTransfer.quantity} ta ko'chatni skanerlash orqali yuklamani {scanningActionType === 'dispatch' ? 'tranzitga berish' : 'inventarga qo\'shish'} jarayoni.
            </p>

            {transferPlantsPool.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-red-600 bg-red-50 rounded-xl border border-red-100">
                Manba ob'ektda so'ralgan ko'chat turidan faollari topilmadi. Avvalo urug' yetishtirib bosqichni yangilang!
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-[10px] text-gray-400 uppercase font-bold font-mono">Qurilmadan skanerlab tasdiqlash simulyatori ({selectedPlantIds.length} / {processingTransfer.quantity} ta)</span>
                
                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 text-xs font-mono">
                  {transferPlantsPool.map(plt => (
                    <label 
                      key={plt.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedPlantIds.includes(plt.id) ? 'bg-emerald-50 border-emerald-300' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedPlantIds.includes(plt.id)}
                        onChange={() => {
                          if (selectedPlantIds.includes(plt.id)) {
                            setSelectedPlantIds(selectedPlantIds.filter(id => id !== plt.id));
                          } else {
                            if (selectedPlantIds.length >= processingTransfer.quantity) {
                              alert("Maksimal so'ralgan miqdorgacha tanladingiz.");
                              return;
                            }
                            setSelectedPlantIds([...selectedPlantIds, plt.id]);
                          }
                        }}
                        className="rounded accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold block text-gray-950">{plt.plant_code}</span>
                        <span className="text-[9px] text-gray-400 block font-sans">Bosqich: {plt.stage.toUpperCase()}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-3 border-t border-gray-150 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-sans">So'ralgan soniga tenglik: <span className="font-bold font-mono">{selectedPlantIds.length} = {processingTransfer.quantity}</span></span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setProcessingTransfer(null);
                        setScanningActionType(null);
                      }}
                      className="px-4 py-1.5 border border-gray-200 text-gray-700 text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button 
                      onClick={scanningActionType === 'dispatch' ? executeDispatch : executeReceive}
                      disabled={selectedPlantIds.length !== processingTransfer.quantity}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs px-5 py-1.5 rounded-xl border border-emerald-500 cursor-pointer shadow-xs transition-all"
                    >
                      {scanningActionType === 'dispatch' ? "Yo'lga chiqarish" : "Qabul qilish va yangilash"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
