import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety, Sale, Plant } from '../types';
import { ShoppingBag, Plus, Check, Receipt, X, Printer, RefreshCw } from 'lucide-react';

interface SalesTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  userId: number;
  userRole: string;
}

export default function SalesTab({ locations, plantTypes, varieties, userId, userRole }: SalesTabProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Sale Register Form
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<number>(0);
  const [selectedPlantType, setSelectedPlantType] = useState<number>(0);
  const [selectedVariety, setSelectedVariety] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(10);
  const [unitPrice, setUnitPrice] = useState<number>(1200);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [notes, setNotes] = useState('');

  // Invoice display
  const [printingInvoice, setPrintingInvoice] = useState<Sale | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleRegisterSale = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !selectedLoc || !selectedPlantType || !selectedVariety || !quantity || !unitPrice) {
      alert("Iltimos barcha kerakli maydonlarni to'ldiring.");
      return;
    }

    try {
      // First let's check if the matching location has enough "ready" plants to accommodate the request!
      const statusData = await api.getLocationInventory(selectedLoc);
      if (statusData.ready < quantity) {
        alert(`Lokatsiyada yetarli tayyor ko'chat yo'q. Hozirda bor: ${statusData.ready} ta. Siz so'rayapsiz: ${quantity} ta.`);
        return;
      }

      // Find plant IDs to mark
      const batches = await api.getBatches({ location_id: selectedLoc });
      let pool: Plant[] = [];
      for (const b of batches) {
        if (b.plant_type_id === selectedPlantType && b.variety_id === selectedVariety) {
          const bp = await api.getBatchPlants(b.id);
          pool = [...pool, ...bp.filter(p => p.stage === 'ready' && !p.is_defect)];
        }
      }

      const selectedIds = pool.slice(0, quantity).map(p => p.id);

      await api.createSale({
        saleData: {
          location_id: Number(selectedLoc),
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          plant_type_id: Number(selectedPlantType),
          variety_id: Number(selectedVariety),
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
          total_price: Number(quantity * unitPrice),
          payment_method: paymentMethod,
          notes,
          sold_by: userId
        },
        plantIds: selectedIds
      });

      setShowSaleModal(false);
      // Reset
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setSelectedLoc(0);
      setSelectedPlantType(0);
      setSelectedVariety(0);
      setQuantity(10);
      setUnitPrice(1200);
      setNotes('');
      
      fetchSales();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmPayment = async (id: number) => {
    try {
      await api.confirmSale(id, userId);
      fetchSales();
    } catch (e) {
      console.error(e);
    }
  };

  const cancelOrder = async (id: number) => {
    try {
      await api.cancelSale(id);
      fetchSales();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900">Sotishlar va Moliyaviy Cheklar (Sales)</h2>
          <p className="text-xs text-gray-500 font-sans">Agranomlar kiritgan sotish cheklari, to'lov usullari va bugalteriya tasdiqlashi.</p>
        </div>
        {userRole === 'agronomist' && (
          <button 
            onClick={() => setShowSaleModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Yangi Sotish Amali
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Yuklanmoqda...
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 font-mono text-xs">
          Hech qanday sotuvlar ro'yxati topilmadi.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Sotuv ID</th>
                <th className="py-3 px-4">Xaridor Ma'lumoti</th>
                <th className="py-3 px-4">Ko'chat turi va Nav</th>
                <th className="py-3 px-4">Soni x Narxi</th>
                <th className="py-3 px-4">Jami Summa</th>
                <th className="py-3 px-4">To'lov / Holati</th>
                <th className="py-3 px-4 text-center">Hujjat (Chek)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {sales.map(sale => {
                const type = plantTypes.find(p => p.id === sale.plant_type_id);
                const variety = varieties.find(v => v.id === sale.variety_id);
                
                let payMethodUz = 'Naqd pul';
                if (sale.payment_method === 'transfer') payMethodUz = "O'tkazma (Karta)";
                if (sale.payment_method === 'credit') payMethodUz = 'Nasiya hamkor';

                let statusBadge = 'bg-amber-100 border-amber-200 text-amber-800';
                let statusUz = 'Kutilmoqda';
                if (sale.status === 'confirmed') {
                  statusBadge = 'bg-emerald-100 border-emerald-250 text-emerald-850';
                  statusUz = 'To\'langan';
                } else if (sale.status === 'cancelled') {
                  statusBadge = 'bg-red-50 border-red-150 text-red-700';
                  statusUz = 'Bekor qilingan';
                }

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-4 font-mono font-bold text-gray-800">#SAL-{String(sale.id).padStart(4, '0')}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{sale.customer_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{sale.customer_phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-800">{type?.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{variety?.name}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-gray-500">
                      {sale.quantity} ta x {sale.unit_price.toLocaleString('uz-UZ')} so'm
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-gray-950">
                      {(sale.total_price).toLocaleString('uz-UZ')} so'm
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <div className="text-[10px] font-sans text-gray-400 font-semibold">{payMethodUz}</div>
                      <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {statusUz}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setPrintingInvoice(sale)}
                          className="p-1 px-1.5 bg-slate-50 border border-gray-250 text-gray-700 rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1 font-mono text-[9px] font-bold"
                        >
                          <Receipt className="h-3 w-3" /> Chek
                        </button>
                        
                        {/* accountant verifies payment */}
                        {sale.status === 'pending' && userRole === 'accountant' && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => cancelOrder(sale.id)}
                              className="bg-red-50 text-red-700 p-1 rounded-lg border border-red-150 hover:bg-red-100 cursor-pointer"
                              title="Rad etish"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => confirmPayment(sale.id)}
                              className="bg-emerald-600 border border-emerald-500 text-white p-1 rounded-lg hover:bg-emerald-700 cursor-pointer"
                              title="To'lovni tasdiqlash"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL: Register New Sale --- */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in-50">
            <button 
              onClick={() => setShowSaleModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-sans text-gray-900 mb-1">Mijozgacha tayyor ko'chat sotish</h3>
            <p className="text-xs text-gray-500 mb-4 font-sans">Sotish cheki yaratilishda faqat 'tayyor' bosqichidagi ko'chat sonigacha ruxsat beriladi.</p>

            <form onSubmit={handleRegisterSale} className="space-y-4 text-xs font-sans">
              <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-gray-100">
                <span className="block text-gray-800 font-bold font-mono text-[10px] uppercase">Xaridor Shartnomasi</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase mb-1">Xaridor Ism Familiyasi *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Masalan, Alisher Usmonov"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase mb-1">Telefon raqami</label>
                    <input 
                      type="text" 
                      placeholder="+99890XXXXXXX"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-mono text-[9px] uppercase mb-1">Mijoz manzili</label>
                  <input 
                    type="text" 
                    placeholder="Viloyat, tuman, mahalla..."
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Zaxira Ob'ekti (Lokatsiya) *</label>
                  <select 
                    value={selectedLoc} 
                    onChange={e => setSelectedLoc(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Navli *</label>
                  <select 
                    value={selectedVariety} 
                    onChange={e => setSelectedVariety(Number(e.target.value))}
                    disabled={!selectedPlantType}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value={0}>-- Tanlang --</option>
                    {varieties.filter(v => v.plant_type_id === selectedPlantType).map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">To'lov Usuli</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="transfer">Karta (O'tkazma)</option>
                    <option value="credit">Nasiya hamkor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Sotiladigan miqdor (Soni) *</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={quantity} 
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden tracking-wider font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 font-mono uppercase text-[10px] mb-1 font-bold">Dona narxi (so'm) *</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={unitPrice} 
                    onChange={e => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-hidden tracking-wider font-mono text-right"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-gray-100/50 text-right">
                <span className="text-gray-450 uppercase block font-mono text-[9px]">Jami Hisoblangan Summa:</span>
                <span className="text-lg font-mono font-bold text-gray-950">{(quantity * unitPrice).toLocaleString('uz-UZ')} so'm</span>
              </div>

              <div className="pt-2 border-t border-gray-150 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl border border-emerald-500 cursor-pointer transition-all"
                >
                  Sotuvni ro'yxatlash (Tasdiqqa)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INVOICE SIMULATED PRINT VIEW --- */}
      {printingInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in-50 flex flex-col justify-between">
            {/* Header toolbar */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-gray-500">INVOICE PREVIEW</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-emerald-50 text-emerald-850 hover:bg-emerald-100 border border-emerald-200 p-1 px-2.5 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Printer className="h-3 w-3" /> Chop Etish
                </button>
                <button 
                  onClick={() => setPrintingInvoice(null)}
                  className="p-1 border border-gray-200 hover:text-gray-600 rounded-lg text-gray-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Simulated Invoice Content */}
            <div className="p-6 bg-slate-50 rounded-xl border border-gray-100 space-y-5 text-gray-800 text-xs font-sans" id="invoice-sheet">
              {/* Logo & ID */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-gray-950 font-sans tracking-tight">FOYDALANI SHARTNOMASI CHEK</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">ISSIQXONA KO'CHAT BOSHQARUV TIZIMI</p>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <span className="font-bold block text-gray-900">#SAL-{String(printingInvoice.id).padStart(4, '0')}</span>
                  <span className="text-gray-400 mt-0.5 block">{new Date(printingInvoice.sold_at).toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>

              {/* Addresses info */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-200/50 py-3 text-[10px]">
                <div className="space-y-1">
                  <span className="text-gray-400 font-mono font-bold uppercase block">Yetkazib beruvchi:</span>
                  <span className="font-bold text-gray-950 block">SS-KO'CHAT Ferma Markazi</span>
                  <p className="text-gray-500">O'zbekiston, Toshkent viloyati, 6-chi teplitsalar majmuasi</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-mono font-bold uppercase block">Xaridor:</span>
                  <span className="font-bold text-gray-950 block">{printingInvoice.customer_name}</span>
                  <p className="text-gray-500">{printingInvoice.customer_address || "Toshkent parvarish ob'ekti"}</p>
                  <span className="font-mono text-gray-600 font-medium block">{printingInvoice.customer_phone}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-gray-400 font-mono font-bold uppercase text-[9px] block">Xarid Tafsiloti</span>
                <div className="bg-white rounded-lg border border-gray-150 overflow-hidden font-mono text-[11px]">
                  <div className="grid grid-cols-4 bg-gray-100 text-[9px] font-bold text-gray-400 uppercase p-2 border-b border-gray-150">
                    <span className="col-span-2">Mahsulot</span>
                    <span className="text-center">Dona</span>
                    <span className="text-right">Summa</span>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 border-b border-gray-50 text-gray-800">
                    <span className="col-span-2 font-sans font-medium text-gray-900">
                      {plantTypes.find(t => t.id === printingInvoice.plant_type_id)?.name} (
                      {varieties.find(v => v.id === printingInvoice.variety_id)?.name})
                    </span>
                    <span className="text-center">{printingInvoice.quantity} x {printingInvoice.unit_price}</span>
                    <span className="text-right font-bold">{(printingInvoice.total_price).toLocaleString('uz-UZ')}</span>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 bg-gray-50/50 text-gray-900 font-bold">
                    <span className="col-span-3 text-right">JAMI TO'LOV:</span>
                    <span className="text-right text-emerald-700">{(printingInvoice.total_price).toLocaleString('uz-UZ')} so'm</span>
                  </div>
                </div>
              </div>

              {/* Payment details status stamp */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-gray-150 font-mono">
                <div>
                  <span className="text-gray-450 block text-[9px] uppercase">To'lov holati:</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border inline-block mt-1 ${
                    printingInvoice.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {printingInvoice.status === 'confirmed' ? ' TASDIQLANDI / TO\'LANDI ' : ' KUTILYAPTI / TO\'LOVSiz '}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-450 block text-[9px] uppercase">To'lov turi:</span>
                  <span className="text-[11px] font-bold text-gray-900">{printingInvoice.payment_method.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-2 pt-4 bg-white flex justify-end">
              <button 
                onClick={() => setPrintingInvoice(null)}
                className="bg-gray-900 hover:bg-gray-850 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
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
