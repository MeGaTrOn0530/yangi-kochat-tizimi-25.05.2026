import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety } from '../types';
import { Activity, Beaker, ShoppingBag, Leaf, DollarSign, ShieldAlert, Thermometer, RefreshCw, FileSpreadsheet, Printer, X, Download } from 'lucide-react';

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
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  const exportToExcel = () => {
    if (!report) return;
    const s = report.summary;
    
    // Create Excel friendly CSV Content with Uzbek UTF-8 BOM
    let csvContent = "\uFEFF"; // UTF-8 BOM for modern Excel compatibility
    csvContent += "========================================================\n";
    csvContent += "YASHIL KO'CHAT BOSHQARUV TIZIMI - YILLIK VA KUNLIK HISOBOT\n";
    csvContent += "========================================================\n";
    csvContent += `Eksport sanasi:;${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}\n`;
    csvContent += `Tizim foydalanuvchisi:;${userRole.toUpperCase()}\n`;
    csvContent += `Status:;AKTIV / ONLINE\n\n`;
    
    csvContent += "1. UMUMIY STATISTIKA (SUMMARY)\n";
    csvContent += "Metrika;Miqdori;O'lchov birligi\n";
    csvContent += `Faol jarayondagi ko'chatlar;${s.activeCount};ta ko'chat\n`;
    csvContent += `Sotuvga tayyor ko'chatlar;${s.readyCount};ta ko'chat\n`;
    csvContent += `Nuqsonli (No-bud qilingan);${s.defectCount};ta ko'chat\n`;
    csvContent += `Jami hisoblangan moliya;${s.totalEarnings};so'm\n\n`;

    csvContent += "2. ISSIQXONA VA LOKATSIYALARNING BANDLIK HOLATI\n";
    csvContent += "Obyekt nomi;Turi;Sig'imi (Maksimal);O'smoqda (Active);Tayyor (Ready);Nuqsonlar (Defect);Bandlik darajasi (%)\n";
    report.locationStats.forEach((loc: any) => {
      const typeStr = loc.type === 'greenhouse' ? 'Teplitsa' : 'Ochiq dala';
      csvContent += `${loc.name};${typeStr};${loc.capacity};${loc.active};${loc.ready};${loc.defect};${loc.capacityUsedPercent}%\n`;
    });
    csvContent += "\n";

    csvContent += "3. QAYD ETILGAN SO'NGGI ZARAR YOKI NUQSONLAR RO'YXATI\n";
    csvContent += "Ko'chat kodi;Sana;Lokatsiya;Partiya kodi;Tavsif / Sabab\n";
    defects.forEach((def: any) => {
      const notesClean = def.notes ? def.notes.replace(/"/g, '""').replace(/\n/g, ' ') : '';
      csvContent += `${def.plant_code};${new Date(def.date).toLocaleDateString('uz-UZ')};${def.location_name};${def.batch_code};"${notesClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Yashil_Koochat_Hisobot_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <span className="text-emerald-700 text-xs mt-1 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
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
            <span className="text-amber-700 text-xs mt-1 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
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
            <span className="p-1 text-red-700 text-xs mt-1 inline-flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-md">
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
            <span className="text-indigo-700 text-xs mt-1 inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
              Tasdiqlangan sotuvlar
            </span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Export & Command Center Action Panel - Brutalist/Bold Typography Styled */}
      <div className="bg-[#111111] p-6 border-2 border-[#222222] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none shrink-0 rounded-none">
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[#00FF00] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-pulse"></span> HISOBOT VA EKSPORT MARKAZI
          </h2>
          <p className="text-[11px] text-[#A0A0A0] mt-1 font-mono uppercase">
            Teplitsa sig'imi, moliya va barcha nuqsonli hisobotlarni PDF yoki Excel formatida saqlang.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-initial bg-[#1A1A1A] hover:bg-[#00FF00] hover:text-[#0A0A0A] text-white border-2 border-[#333333] hover:border-transparent font-black px-5 py-3 text-xs uppercase font-mono tracking-tight flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer rounded-none"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" /> EXCEL (CSV) EKSPORT
          </button>
          <button 
            onClick={() => setShowPrintModal(true)}
            className="flex-1 md:flex-initial bg-[#E0E0E0] hover:bg-[#00FF00] text-[#0A0A0A] font-black px-5 py-3 text-xs uppercase font-mono tracking-tight flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer border border-transparent rounded-none"
          >
            <Printer className="h-4.5 w-4.5 shrink-0" /> PDF CHOP ETISH
          </button>
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
                className="flex items-center gap-2 text-xs font-mono text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 animate-spin duration-3000" /> Yangilash
              </button>
            </div>

            {/* Quick Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => setActiveLocFilter(null)}
                className={`text-xs px-3.5 py-1.5 rounded-md border transition-all cursor-pointer font-bold ${
                  activeLocFilter === null 
                    ? 'bg-emerald-650 text-white border-emerald-600 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Hammasi
              </button>
              {locations.map(loc => (
                <button 
                  key={loc.id}
                  onClick={() => setActiveLocFilter(loc.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-md border transition-all cursor-pointer font-bold ${
                    activeLocFilter === loc.id 
                      ? 'bg-emerald-650 text-white border-emerald-600 shadow-sm' 
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
                      <span className="text-xs font-normal text-gray-400 font-mono">({loc.type === 'greenhouse' ? "Issiqxona" : "Ochiq dala"})</span>
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
                        <div className="w-12 h-12 bg-red-100 flex items-center justify-center text-red-600 font-mono text-xs uppercase shrink-0">
                          Rasm
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

      {/* --- BRUTALIST PRINTABLE PREVIEW & SAVE PDF MODAL --- */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/90 flex flex-col justify-start items-center p-4 md:p-10 z-50 overflow-y-auto font-mono">
          
          {/* Print only @media stylesheet injection */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              /* Hide standard web wrapper components of browser page */
              body * {
                visibility: hidden !important;
              }
              /* Display ONLY user-selected printable layout */
              #brutalist-printable-area, #brutalist-printable-area * {
                visibility: visible !important;
              }
              #brutalist-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background-color: #FFFFFF !important;
                color: #000000 !important;
                padding: 2.5rem !important;
              }
              /* Adjust visual styling flags inside PDF mode to high contract dark outline on white background */
              .print-black-border {
                border: 2px solid #000000 !important;
              }
              .print-bg-gray {
                background-color: #F0F0F0 !important;
              }
              .print-hidden {
                display: none !important;
              }
            }
          `}} />

          {/* Modal head controllers (Hidden during print engine execution) */}
          <div className="max-w-4xl w-full bg-[#111111] border-2 border-[#333333] p-5 mb-4 flex justify-between items-center print-hidden select-none">
            <div className="flex items-center gap-3">
              <div className="bg-[#1C1C1C] text-[#00FF00] font-bold p-2 text-xs border border-[#333333]">
                PDF/PRINTER ENGINE READY
              </div>
              <p className="text-xs text-gray-400">Tizim hisoboti chop etishga mukammal sozlangan.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()} 
                className="bg-[#00FF00] hover:bg-white text-black font-black uppercase text-xs px-5 py-2.5 rounded-none flex items-center gap-2 transition-colors duration-200 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> CHOP ETISH / PDF SAQLASH
              </button>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="bg-[#222222] hover:bg-red-600 text-white font-black uppercase text-xs px-4 py-2.5 rounded-none flex items-center gap-1.5 transition-colors duration-200 cursor-pointer border border-[#333333]"
              >
                <X className="h-4 w-4" /> YOPISH
              </button>
            </div>
          </div>

          {/* Printable Brutalist Form Area (Targeted exclusively by CSS print pipeline) */}
          <div 
            id="brutalist-printable-area" 
            className="max-w-4xl w-full bg-black text-[#E0E0E0] border-2 border-[#333333] p-10 space-y-8 select-text relative print-black-border print-bg-gray"
          >
            {/* Header section matches Terminal / Corporate aesthetic */}
            <header className="flex justify-between items-start border-b-2 border-dashed border-[#555] pb-6">
              <div>
                <h1 className="text-3xl font-black text-white tracking-widest uppercase leading-none pb-2">
                  Yashil Ko'chat MChJ
                </h1>
                <p className="text-xs text-[#00FF00] font-bold uppercase tracking-widest">
                  TOSHKENT MARKAZIY BOSHQARUV TIZIMI v1.0
                </p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase">
                  Obyektlar: 6 ta issiqxona va 2 ta ochiq dala monitoringi
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">HISOBOT RAQAMI: #MON-{new Date().toISOString().slice(2, 10).replace(/-/g, '')}</p>
                <p className="text-xs text-white font-bold mt-1 uppercase">SANA: {new Date().toLocaleDateString('uz-UZ')}</p>
                <p className="text-[10px] text-gray-450 mt-1 uppercase font-mono">STATUS: AKTIV GURUH</p>
                <p className="text-[10px] text-gray-450 mt-0.5 uppercase font-mono">XALQARO METRIKA: SI-SYSTEM</p>
              </div>
            </header>

            {/* Overall summaries */}
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#00FF00] border-b border-[#222] pb-1.5">
                I. UMUMIY METRIKALAR XULOSASI (METRICS SUMMARY)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#111111] border border-[#222222] print-black-border text-center">
                  <span className="text-[10px] text-gray-400 uppercase">Jarayonda (Tirik)</span>
                  <span className="text-2xl font-black text-white block mt-1">{s.activeCount} ta</span>
                </div>
                <div className="p-4 bg-[#111111] border border-[#222222] print-black-border text-center">
                  <span className="text-[10px] text-gray-400 uppercase">Sotuvga Tayyor</span>
                  <span className="text-2xl font-black text-[#00FF00] block mt-1">{s.readyCount} ta</span>
                </div>
                <div className="p-4 bg-[#111111] border border-[#222222] print-black-border text-center">
                  <span className="text-[10px] text-gray-400 uppercase">No-bud (Nuqsonlar)</span>
                  <span className="text-2xl font-black text-red-500 block mt-1">{s.defectCount} ta</span>
                </div>
                <div className="p-4 bg-[#111111] border border-[#222222] print-black-border text-center">
                  <span className="text-[10px] text-gray-400 uppercase">Tasdiqlangan Moliya</span>
                  <span className="text-lg font-black text-white block mt-2 truncate w-full">{s.totalEarnings.toLocaleString('uz-UZ')} so'm</span>
                </div>
              </div>
            </section>

            {/* Mid-level Capacity metrics list */}
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#00FF00] border-b border-[#222] pb-1.5">
                II. LOKATSIYAVIY MONITORING NATORIYATI (INFRASTRUCTURE LOAD)
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#444] text-gray-450">
                    <th className="py-2.5">LOKATSIYA NOMI</th>
                    <th className="py-2.5">TURI</th>
                    <th className="py-2.5 text-right">HAMMASI (FOIZ)</th>
                    <th className="py-2.5 text-right">O'SMOQDA (ACTIVE)</th>
                    <th className="py-2.5 text-right">TAYYOR (READY)</th>
                    <th className="py-2.5 text-right">NUQSONLAR</th>
                    <th className="py-2.5 text-right">Maksimal Sig'im</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {report.locationStats.map((loc: any) => (
                    <tr key={loc.id} className="text-white hover:bg-neutral-900">
                      <td className="py-2.5 font-bold flex items-center gap-1">
                        ■ {loc.name}
                      </td>
                      <td className="py-2.5 uppercase font-mono text-[10px] text-gray-400">
                        {loc.type === 'greenhouse' ? 'Teplitsa' : 'Ochiq dala'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-[#00FF00]">
                        {loc.capacityUsedPercent}%
                      </td>
                      <td className="py-2.5 text-right text-gray-300">
                        {loc.active}
                      </td>
                      <td className="py-2.5 text-right text-[#00FF00]">
                        {loc.ready}
                      </td>
                      <td className="py-2.5 text-right text-red-500">
                        {loc.defect}
                      </td>
                      <td className="py-2.5 text-right text-gray-400 font-mono">
                        {loc.capacity} ta
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Last defects database */}
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#00FF00] border-b border-[#222] pb-1.5">
                III. FAOL QAYD ETILGAN NUQSONLAR VA NO-BUDLAR
              </h3>
              {defects.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Hozircha tizimda hech qanday no-budlar qayd etilmagan.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#444] text-gray-450">
                      <th className="py-2.5">O'SIMLIK KODI</th>
                      <th className="py-2.5">KAYD SANASI</th>
                      <th className="py-2.5">LOKATSIYASI</th>
                      <th className="py-2.5">PARTIYASI</th>
                      <th className="py-2.5">MUAMMO BATAFSIL / IZOHI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {defects.slice(0, 15).map((def: any) => (
                      <tr key={def.id} className="text-white">
                        <td className="py-2.5 font-bold text-red-500">
                          {def.plant_code}
                        </td>
                        <td className="py-2.5 text-gray-400">
                          {new Date(def.date).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-2.5 uppercase text-gray-300">
                          {def.location_name}
                        </td>
                        <td className="py-2.5 font-bold text-gray-400 font-mono">
                          {def.batch_code}
                        </td>
                        <td className="py-2.5 text-gray-300">
                          {def.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Verification Stamper and Footer Signature boxes */}
            <footer className="pt-16 border-t-2 border-dashed border-[#555] grid grid-cols-2 md:grid-cols-3 gap-8 text-[11px] uppercase tracking-wide">
              <div>
                <p className="text-gray-500 font-mono">Mas'ul Shaxs:</p>
                <div className="h-10 mt-2 border-b border-gray-600"></div>
                <p className="mt-2 text-gray-400 font-mono">Bosh Agronom Imzosi</p>
              </div>

              <div>
                <p className="text-gray-500 font-mono">Tekshirildi:</p>
                <div className="h-10 mt-2 border-b border-gray-600"></div>
                <p className="mt-2 text-gray-400 font-mono">Hisobchi / Administrator</p>
              </div>

              <div className="col-span-2 md:col-span-1 border border-dashed border-[#333] p-4 text-center text-[9px] font-mono text-gray-500 flex flex-col justify-center items-center">
                <p className="font-bold text-white mb-1">RAQAMLI MUHR / SECURE SHA2</p>
                <p>CERTIFIED SYSTEM AUTOMATION v1</p>
                <p className="text-[#00FF00] font-black mt-2">● SECURE_ENCR_OK</p>
              </div>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}
