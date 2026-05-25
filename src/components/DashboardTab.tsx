import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety } from '../types';
import { Activity, Beaker, ShoppingBag, Leaf, DollarSign, ShieldAlert, Thermometer, RefreshCw } from 'lucide-react';

interface DashboardTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  userRole: string;
}

export default function DashboardTab({ locations, plantTypes, varieties, userRole }: DashboardTabProps) {
  const [report, setReport] = useState<any>(null);
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocFilter, setActiveLocFilter] = useState<number | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardReport();
      const defectData = await api.getDefectsReport();
      setReport(data);
      setDefects(defectData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
        <p>Hisobotlar yuklanmoqda...</p>
      </div>
    );
  }

  const s = report.summary;
  const filteredLocationStats = activeLocFilter
    ? report.locationStats.filter((l: any) => l.id === activeLocFilter)
    : report.locationStats;

  return (
    <div className="space-y-6">
      {/* Upper Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Jarayonda (Tirik)</span>
            <span className="text-3xl font-bold font-sans text-gray-950 mt-1 block">{s.activeCount} <span className="text-xs text-gray-400 font-normal">ko'chat</span></span>
            <span className="text-emerald-700 text-xs mt-1 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
              Faol o'simliklar
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Leaf className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Sotuvga Tayyor</span>
            <span className="text-3xl font-bold font-sans text-amber-600 mt-1 block">{s.readyCount} <span className="text-xs text-gray-400 font-normal">ko'chat</span></span>
            <span className="text-amber-700 text-xs mt-1 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              Uzatishga shay
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Xavf / No-bud</span>
            <span className="text-3xl font-bold font-sans text-red-600 mt-1 block">{s.defectCount} <span className="text-xs text-gray-400 font-normal">ko'chat</span></span>
            <span className="p-1 text-red-700 text-xs mt-1 inline-flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
              Nuqson aniqlangan
            </span>
          </div>
          <div className="p-3 bg-red-50 rounded-2xl text-red-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-mono uppercase tracking-wider block">Jami Daromad</span>
            <span className="text-2xl font-bold font-sans text-indigo-950 mt-1 block">
              {s.totalEarnings.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so'm</span>
            </span>
            <span className="text-indigo-700 text-xs mt-1 inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
              Tasdiqlangan sotuvlar
            </span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Greenhouse lists Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-sans text-gray-900">Lokatsiyalar bo’yicha ko’chat sig’imi monitoringi</h3>
                <p className="text-xs text-gray-500 font-sans">6 ta issiqxona va 2 ta ochiq daladagi bandlik darajasi</p>
              </div>
              <button 
                onClick={fetchReport} 
                className="flex items-center gap-2 text-xs font-mono text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-all"
              >
                <RefreshCw className="h-3 w-3" /> Yangilash
              </button>
            </div>

            {/* Quick Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => setActiveLocFilter(null)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  activeLocFilter === null 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Hammasi
              </button>
              {locations.map(loc => (
                <button 
                  key={loc.id}
                  onClick={() => setActiveLocFilter(loc.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    activeLocFilter === loc.id 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {/* Location Bars */}
            <div className="space-y-5">
              {filteredLocationStats.map((loc: any) => (
                <div key={loc.id} className="p-4 rounded-xl border border-gray-50 bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${loc.type === 'greenhouse' ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
                      {loc.name}
                      <span className="text-xs font-normal text-gray-400 font-mono">({loc.type === 'greenhouse' ? 'Teplitsa' : 'Ochiq dala'})</span>
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {loc.active + loc.ready} / {loc.capacity} <span className="font-semibold text-gray-900">({loc.capacityUsedPercent}%)</span>
                    </span>
                  </div>

                  {/* Visual Bar progress */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        loc.capacityUsedPercent > 85 ? 'bg-red-500' : loc.capacityUsedPercent > 60 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(loc.capacityUsedPercent, 100)}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-gray-100/50 text-center font-mono text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">O'smoqda</span>
                      <span className="font-semibold text-gray-800">{loc.active}</span>
                    </div>
                    <div>
                      <span className="text-amber-500 block text-[10px] uppercase">Tayyor</span>
                      <span className="font-semibold text-amber-600">{loc.ready}</span>
                    </div>
                    <div>
                      <span className="text-red-400 block text-[10px] uppercase">Nuqson</span>
                      <span className="font-semibold text-red-500">{loc.defect}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Recent Defect logs */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold font-sans text-gray-950 flex items-center gap-2">
                  <ShieldAlert className="text-red-500 h-5 w-5" /> So'nggi Nuqsonlar (Surat va Izoh)
                </h3>
              </div>

              {defects.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-mono">
                  Sog'lom o'sish - nuqsonlar qayd qilinmagan.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {defects.map(def => (
                    <div key={def.id} className="p-3 bg-red-50/50 rounded-xl border border-red-50 flex items-start gap-3 text-xs">
                      {def.image ? (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                          <img src={def.image} alt="Defect" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-mono text-xs uppercase shrink-0">
                          No Pic
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-100">{def.plant_code}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{new Date(def.date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <p className="font-sans text-gray-600 font-medium leading-relaxed">{def.notes}</p>
                        <div className="flex flex-wrap gap-x-2 text-[10px] text-gray-400">
                          <span>Lokatsiya: {def.location_name}</span>
                          <span>Partiya: {def.batch_code}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Help Guide */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-950 text-xs leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1"><Thermometer className="h-4 w-4" /> Boshqaruv Ma'lumoti:</span>
              <p>Har qanday nav o'zgarishi, qabul qilish yoki nuqson belgisi skanerlash moduli orqali amalga oshirilganda bu yerga kelib tushadi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
