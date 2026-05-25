import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety } from '../types';
import { Check, X, ShieldAlert, FileMinus, RefreshCw } from 'lucide-react';

interface ApprovalsTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  userId: number;
}

export default function ApprovalsTab({ locations, plantTypes, varieties, userId }: ApprovalsTabProps) {
  const [pendings, setPendings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendings = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingApprovals();
      setPendings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendings();
  }, []);

  const handleAction = async (historyId: number, isApproved: boolean) => {
    try {
      await api.approveStageHistory(historyId, {
        approvedBy: userId,
        isApproved
      });
      fetchPendings();
    } catch (e) {
      console.error(e);
      alert("Xatolikka yo'l qo'yildi");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-sans text-gray-900">Bosh Agronom Tasdiqlash Zanjiri (Approvals)</h2>
        <p className="text-xs text-gray-500">Agronomlar tomonidan kiritilgan o'sish bosqichlari o'zgarishini tasdiqlash yoki rad etish paneli.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Yuklanmoqda...
        </div>
      ) : pendings.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <Check className="h-8 w-8 text-emerald-600 bg-emerald-50 rounded-full p-1.5" />
          Hech qanday kutilayotgan tasdiq so'rovlari mavjud emas. Barcha ko'chatlar barkamol parvarish ostida.
        </div>
      ) : (
        <div className="space-y-3">
          {pendings.map(item => {
            const type = plantTypes.find(t => t.id === item.plant_type_id);
            const variety = varieties.find(v => v.id === item.variety_id);
            
            return (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-150">
                <div className="space-y-2 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 bg-slate-100 px-2 py-0.5 rounded border border-gray-150">{item.plant_code}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400 font-mono">Partiya: {item.batch_code}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-semibold">{item.changed_by_name} (Agronomist)</span>
                  </div>

                  <div className="font-sans font-medium text-gray-800 text-sm">
                    {type?.name} ({variety?.name}) <span className="text-gray-400 font-normal">ko'chati</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-gray-400 font-medium">O'tish:</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase text-[10px]">{item.from_stage || 'boshlamoq'}</span>
                    <span className="text-gray-400">→</span>
                    <span className={`bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded font-bold uppercase text-[10px] ${item.to_stage === 'defect' ? 'bg-red-50 text-red-700 border-red-150' : ''}`}>
                      {item.to_stage === 'defect' ? 'Nuqson (Xavf)' : item.to_stage}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-gray-600 italic">
                      " {item.notes} "
                    </p>
                  )}

                  {item.defect_image && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Nuqson surati biriktirilgan:</span>
                      <a href={item.defect_image} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 font-bold underline text-[10px]">Ko'rish</a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button 
                    onClick={() => handleAction(item.id, false)}
                    className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all inline-flex items-center gap-1 text-xs font-semibold"
                  >
                    <X className="h-4 w-4" /> Rad etish
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, true)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white rounded-xl cursor-pointer transition-all inline-flex items-center gap-1 text-xs font-bold"
                  >
                    <Check className="h-4 w-4" /> Tasdiqlash
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
