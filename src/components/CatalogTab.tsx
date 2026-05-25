import { useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety, GraftType } from '../types';
import { BookOpen, Plus, Tag, Layers, Settings, X, RefreshCw } from 'lucide-react';

interface CatalogTabProps {
  plantTypes: PlantType[];
  varieties: Variety[];
  graftTypes: GraftType[];
  userId: number;
  userRole: string;
  onRefresh: () => void;
}

export default function CatalogTab({ plantTypes, varieties, graftTypes, userId, userRole, onRefresh }: CatalogTabProps) {
  const [activeTab, setActiveTab] = useState<'types' | 'varieties' | 'grafts'>('types');

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'type' | 'variety' | 'graft'>('type');
  
  // Fields for Forms
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [selectedPlantType, setSelectedPlantType] = useState<number>(0);
  const [varietyName, setVarietyName] = useState('');
  const [varietyDesc, setVarietyDesc] = useState('');
  const [graftName, setGraftName] = useState('');
  const [graftDesc, setGraftDesc] = useState('');

  const isLaborantOrAdmin = userRole === 'laborant' || userRole === 'admin';

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'type') {
        if (!typeName) return;
        await api.createPlantType({ name: typeName, description: typeDesc, created_by: userId });
        setTypeName('');
        setTypeDesc('');
      } else if (modalType === 'variety') {
        if (!varietyName || !selectedPlantType) return;
        await api.createVariety({ plant_type_id: Number(selectedPlantType), name: varietyName, description: varietyDesc, created_by: userId });
        setVarietyName('');
        setVarietyDesc('');
        setSelectedPlantType(0);
      } else if (modalType === 'graft') {
        if (!graftName) return;
        await api.createGraftType({ name: graftName, description: graftDesc });
        setGraftName('');
        setGraftDesc('');
      }
      setShowModal(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const openCreateModal = (type: 'type' | 'variety' | 'graft') => {
    if (!isLaborantOrAdmin) {
      alert("Sizda katalog qo'shish huquqi yo'q.");
      return;
    }
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 flex items-center gap-1.5"><BookOpen className="text-emerald-600 h-5 w-5" /> Katalog va Nomenklaturalar Boshqaruvi (Labarant)</h2>
          <p className="text-xs text-gray-500 font-sans">Laborant va Adminlar tomonidan boshqariladigan ko'chat lug'ati (navlar, gibridlar, payvandlash turlari).</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'types' && (
            <button 
              onClick={() => openCreateModal('type')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 cursor-pointer flex items-center gap-1 transition-all"
            >
              <Plus className="h-4 w-4" /> Kategoriya Qo'shish
            </button>
          )}
          {activeTab === 'varieties' && (
            <button 
              onClick={() => openCreateModal('variety')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 cursor-pointer flex items-center gap-1 transition-all"
            >
              <Plus className="h-4 w-4" /> Nav Qo'shish
            </button>
          )}
          {activeTab === 'grafts' && (
            <button 
              onClick={() => openCreateModal('graft')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 cursor-pointer flex items-center gap-1 transition-all"
            >
              <Plus className="h-4 w-4" /> Payvand turi Qo'shish
            </button>
          )}
        </div>
      </div>

      {/* Catalog navigation menu */}
      <div className="flex border-b border-gray-100 gap-1.5">
        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'types' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Layers className="h-4 w-4" /> Ko'chat Turlari ({plantTypes.length} ta)
        </button>
        <button
          onClick={() => setActiveTab('varieties')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'varieties' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Tag className="h-4 w-4" /> Navlar (Varieties) ({varieties.length} ta)
        </button>
        <button
          onClick={() => setActiveTab('grafts')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'grafts' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="h-4 w-4" /> Payvand Turlari ({graftTypes.length} ta)
        </button>
      </div>

      {/* Catalog items content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'types' && plantTypes.map(pt => (
          <div key={pt.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Ko'chat turi</span>
            <h4 className="font-bold text-sm text-gray-900 pt-1">{pt.name}</h4>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">{pt.description || "Tavsif kiritilmagan."}</p>
            <div className="pt-2 text-[10px] text-gray-400 font-mono">ID: PT-00{pt.id}</div>
          </div>
        ))}

        {activeTab === 'varieties' && varieties.map(v => {
          const pt = plantTypes.find(p => p.id === v.plant_type_id);
          return (
            <div key={v.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Kategoriya: {pt?.name || "Noma'lum"}</span>
              <h4 className="font-bold text-sm text-gray-900 pt-1">{v.name}</h4>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">{v.description || "Tavsif kiritilmagan."}</p>
              <div className="pt-2 text-[10px] text-gray-400 font-mono">ID: V-00{v.id}</div>
            </div>
          );
        })}

        {activeTab === 'grafts' && graftTypes.map(gt => (
          <div key={gt.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full uppercase">Payvandlash turi</span>
            <h4 className="font-bold text-sm text-gray-900 pt-1">{gt.name}</h4>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">{gt.description || "Tavsif kiritilmagan."}</p>
            <div className="pt-2 text-[10px] text-gray-400 font-mono">ID: GT-00{gt.id}</div>
          </div>
        ))}
      </div>

      {/* --- DETAILS MODAL: Add Catalog Entity --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-md w-full p-6 shadow-2xl relative animate-in fade-in-50">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold font-sans text-gray-900 mb-1">
              {modalType === 'type' ? "Yangi Ko'chat Kategoriya qo'shish" : modalType === 'variety' ? "Yangi Ko'chat Nav qo'shish" : "Yangi Payvandlash turi qo'shish"}
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-sans">Ushbu ro'yxat agronomlar partiya yaratishda va hisobotlashda umumiy katalog asosi sifatida qo'llaniladi.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              {modalType === 'type' && (
                <>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Kategoriya Nomi *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Masalan, Pomidor, Bodring..."
                      value={typeName}
                      onChange={e => setTypeName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Tavsifi / O'ziga xosligi</label>
                    <textarea 
                      rows={3}
                      placeholder="Ko'chat turi haqida izoh..."
                      value={typeDesc}
                      onChange={e => setTypeDesc(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'variety' && (
                <>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Qaysi Kategoriya ostiga (Ko'chat turi) *</label>
                    <select 
                      value={selectedPlantType} 
                      onChange={e => setSelectedPlantType(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value={0}>-- Tanlang --</option>
                      {plantTypes.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Navli / Gibrid Nomi *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Masalan, Vikendi F1"
                      value={varietyName}
                      onChange={e => setVarietyName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Tavsifi / Hosildorlik normalari</label>
                    <textarea 
                      rows={3}
                      placeholder="Tavsilotlar yozing..."
                      value={varietyDesc}
                      onChange={e => setVarietyDesc(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'graft' && (
                <>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Uslub/Tekshiruv Nomi *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Masalan, Til-til usuli, Yon qirqim..."
                      value={graftName}
                      onChange={e => setGraftName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Tavsifi</label>
                    <textarea 
                      rows={3}
                      placeholder="Jarayon normalari yoki ko'rsatmalari..."
                      value={graftDesc}
                      onChange={e => setGraftDesc(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-gray-150 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-750 font-medium rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl border border-emerald-500 cursor-pointer transition-all"
                >
                  Tasdiqlash va Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
