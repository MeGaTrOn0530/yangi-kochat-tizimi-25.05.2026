import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Location, PlantType, Variety } from '../types';
import { 
  Activity, Leaf, DollarSign, ShieldAlert, Thermometer, RefreshCw, 
  FileSpreadsheet, Printer, X, Lightbulb, ThumbsUp, Sparkles, MessageSquare, 
  Plus, CheckCircle, Flame, Layers 
} from 'lucide-react';

interface DashboardTabProps {
  locations: Location[];
  plantTypes: PlantType[];
  varieties: Variety[];
  userRole: string;
  theme?: string; // Enhanced theme parameter passed from main App
}

interface TechIdea {
  id: string;
  title: string;
  desc: string;
  category: string;
  status: 'jarayonda' | 'kiritildi' | 'reja' | 'goya' | 'bajarildi';
  progress: number; // 0-100
  votes: number;
  author: string;
  impact: 'Yuqori' | "O'rtacha" | 'Past';
}

// Creative seed ideas tailored exactly to the app's real flow and user suggestions
const DEFAULT_IDEAS: TechIdea[] = [
  {
    id: 'idea-1',
    title: "Vazifalarning Bajarilish Foiz Tizimi (Kadrlar KPI)",
    desc: "Tizimdagi topshiriqlar bo'limida har bir agronom yoki laboratoriya xodimining unumdorligini, topshiriqlar sonini va topshirilish foizini (KPI) avtomatik hisoblab chiquvchi status-metrikalari.",
    category: "Kadrlar Unumdorligi",
    status: 'jarayonda',
    progress: 75,
    votes: 42,
    author: "Agronomlar Kengashi",
    impact: "Yuqori"
  },
  {
    id: 'idea-2',
    title: "Filtrli Karantin va Kasallangan Ko'chatlar Hududi",
    desc: "Skanerlash vaqtida 'kasallanish aniqlangan' ko'chatlarni avtomatik tarzda maxsus izolyatsiyalangan 'Karantin' tokchasiga ko'chirish, qizil rangli QR va datchik ogohlantirishlarini yoqish.",
    category: "Kasallik Nazorati",
    status: 'kiritildi',
    progress: 90,
    votes: 57,
    author: "Diyorbek (Bosh Agronom)",
    impact: "Yuqori"
  },
  {
    id: 'idea-3',
    title: "IoT Tuproq Namligi va Avtomatik Sug'orish Tizimi",
    desc: "Har bir Teplitsa tokchasiga (Shelves) tuproq namligi va harorat simsiz datchiklarini o'rnatish orqali suv ta'minoti klapanlarini tizim orqali avtomatik nazorat qilish.",
    category: "Avtomatizatsiya",
    status: 'reja',
    progress: 20,
    votes: 31,
    author: "IoT Muhandislar Guruhi",
    impact: "Yuqori"
  },
  {
    id: 'idea-4',
    title: "AI Kompyuterli Vision Kasalliklarni Diagnostikasi",
    desc: "Skanerlash modulida telefon kamerasi bilan ko'chat bargini rasmga olib, uning sarg'ayishi yoki mikroblarini aniqlaydigan neyron tarmoq diagnostika modelini integratsiya qilish.",
    category: "Sun'iy Intellekt (AI)",
    status: 'goya',
    progress: 10,
    votes: 74,
    author: "Tizim Analitigi",
    impact: "Yuqori"
  },
  {
    id: 'idea-5',
    title: "Xalqaro Sifat Standarti - GlobalGAP uchun Tayyorlik Moduli",
    desc: "Ekilgan dori preparatlari, mineral o'g'itlar va sug'orish jurnallarini avtomatik yig'ib, GlobalGAP xalqaro sertifikati andozalarida birgina tugma bilan eksport qiluvchi tizim yaratish.",
    category: "Muvofiqlik",
    status: 'reja',
    progress: 35,
    votes: 21,
    author: "Logistika Mas'uli",
    impact: "O'rtacha"
  }
];

export default function DashboardTab({ locations, plantTypes, varieties, userRole, theme }: DashboardTabProps) {
  const [report, setReport] = useState<any>(null);
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocFilter, setActiveLocFilter] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  const isDark = theme === 'dark';

  // State managers for dynamic Ideas system with local storage persistency
  const [ideas, setIdeas] = useState<TechIdea[]>(() => {
    const saved = localStorage.getItem('yashil_koochat_ideas_portal');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing saved ideas, reverting to defaults", e);
      }
    }
    return DEFAULT_IDEAS;
  });

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Avtomatizatsiya');
  const [newImpact, setNewImpact] = useState<'Yuqori' | "O'rtacha" | 'Past'>('O\'rtacha');
  const [newStatus, setNewStatus] = useState<'jarayonda' | 'kiritildi' | 'reja' | 'goya' | 'bajarildi'>('goya');
  const [newProgress, setNewProgress] = useState(15);
  const [showAddForm, setShowAddForm] = useState(false);
  const [ideaFilter, setIdeaFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredIdeas = ideaFilter === 'all' 
    ? ideas 
    : ideas.filter(idea => idea.status === ideaFilter);

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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVote = (id: string) => {
    const updated = ideas.map(idea => {
      if (idea.id === id) {
        return { ...idea, votes: idea.votes + 1 };
      }
      return idea;
    });
    setIdeas(updated);
    localStorage.setItem('yashil_koochat_ideas_portal', JSON.stringify(updated));
    triggerToast("G'oyaga ovozingiz muvaffaqiyatli topshirildi, agrosanoat rivojlanishiga qo'shgan hissangiz uchun rahmat!");
  };

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      triggerToast("Iltimos, g'oya sarlavhasi va izohini to'liq kiriting!");
      return;
    }

    const customIdea: TechIdea = {
      id: 'idea-' + Date.now(),
      title: newTitle.trim(),
      desc: newDesc.trim(),
      category: newCategory,
      status: newStatus,
      progress: Math.min(Math.max(Number(newProgress), 0), 100),
      votes: 1,
      author: userRole === 'admin' ? "Administrator" : userRole === 'head_agronomist' ? "Bosh Agronom" : "Texnik Mutaxassis",
      impact: newImpact
    };

    const updated = [customIdea, ...ideas];
    setIdeas(updated);
    localStorage.setItem('yashil_koochat_ideas_portal', JSON.stringify(updated));

    // Reset fields
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Avtomatizatsiya');
    setNewImpact('O\'rtacha');
    setNewStatus('goya');
    setNewProgress(15);
    setShowAddForm(false);
    triggerToast("Yangi g'oyangiz muvaffaqiyatli saqlandi va integratsiya qilindi!");
  };

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
      <div className={`flex flex-col items-center justify-center p-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <RefreshCw className="h-10 w-10 animate-spin text-emerald-500 mb-3" />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Elektron datchiklardan hisobotlar yuklanmoqda...</p>
      </div>
    );
  }

  const s = report.summary;
  const filteredLocationStats = activeLocFilter
    ? report.locationStats.filter((l: any) => l.id === activeLocFilter)
    : report.locationStats;

  const ideaCategories = ["Kadrlar Unumdorligi", "Kasallik Nazorati", "Avtomatizatsiya", "Sun'iy Intellekt (AI)", "Muvofiqlik", "Iqtisodiyot"];

  return (
    <div className="space-y-6">
      
      {/* Toast alert indicator */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-55 bg-zinc-900 border-2 border-emerald-500 text-emerald-400 px-5 py-3.5 shadow-2xl font-mono text-xs uppercase tracking-tight flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 
        PREMIUM RANG SOLISHTIRISH & STATS CARD GRID
        Using subtle dynamic tints to give extreme visual depth and elegant responsive behavior.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 - Active Crop (Organic Green Glow) */}
        <div className={`p-6 border transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
          isDark 
            ? 'bg-[#0b1812] border-emerald-950/55 text-emerald-50 hover:border-emerald-500/30 shadow-[0_4px_30px_rgba(16,185,129,0.06)]' 
            : 'bg-emerald-50/20 border-emerald-100/80 text-emerald-950 hover:border-emerald-250 shadow-[0_4px_20px_rgba(16,185,129,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-emerald-400/80' : 'text-emerald-800'}`}>
              Jarayonda (Tirik)
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-100/50 text-emerald-700'}`}>
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className={`text-3xl font-black font-sans block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {s.activeCount} <span className="text-xs font-bold text-gray-400 font-mono">ko'chat</span>
            </span>
            <span className={`text-[10px] mt-2 inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100/70 text-emerald-800'
            }`}>
              ● Faol o'simliklar
            </span>
          </div>
        </div>

        {/* Metric 2 - Ready Crops (Amber Warm Glow) */}
        <div className={`p-6 border transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
          isDark 
            ? 'bg-[#1b1207] border-amber-950/50 text-amber-50 hover:border-amber-500/30 shadow-[0_4px_30px_rgba(245,158,11,0.05)]' 
            : 'bg-amber-50/20 border-amber-100/80 text-amber-950 hover:border-amber-250 shadow-[0_4px_20px_rgba(245,158,11,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-amber-400/80' : 'text-amber-800'}`}>
              Sotuvga Tayyor
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-100/50 text-amber-700'}`}>
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div>
            <span className={`text-3xl font-black font-sans block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {s.readyCount} <span className="text-xs font-bold text-gray-400 font-mono">ko'chat</span>
            </span>
            <span className={`text-[10px] mt-2 inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded ${
              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100/70 text-amber-800'
            }`}>
              ● Uzatishga shay holatda
            </span>
          </div>
        </div>

        {/* Metric 3 - Danger / Defects (Severe Scarlet Glow) */}
        <div className={`p-6 border transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
          isDark 
            ? 'bg-[#190909] border-red-950/55 text-red-50 hover:border-red-500/30 shadow-[0_4px_30px_rgba(239,68,68,0.06)]' 
            : 'bg-red-50/15 border-red-100/80 text-red-920 hover:border-red-200 shadow-[0_4px_20px_rgba(239,68,68,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-red-400/80' : 'text-red-800'}`}>
              Xavf / No-bud
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-red-950/40 text-red-400' : 'bg-red-100/50 text-red-700'}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className={`text-3xl font-black font-sans block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {s.defectCount} <span className="text-xs font-bold text-gray-400 font-mono">ko'chat</span>
            </span>
            <span className={`text-[10px] mt-2 inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded ${
              isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-100/70 text-red-700'
            }`}>
              ⚠️ Nuqson qayd qilingan
            </span>
          </div>
        </div>

        {/* Metric 4 - Total Earnings (Royal Indigo Glow) */}
        <div className={`p-6 border transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
          isDark 
            ? 'bg-[#0d091a] border-indigo-950/50 text-indigo-50 hover:border-indigo-500/30 shadow-[0_4px_30px_rgba(99,102,241,0.05)]' 
            : 'bg-indigo-50/20 border-indigo-100/80 text-indigo-950 hover:border-indigo-250 shadow-[0_4px_20px_rgba(99,102,241,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-indigo-400/80' : 'text-indigo-800'}`}>
              Jami Tushumlar
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-950/40 text-indigo-400' : 'bg-indigo-100/50 text-indigo-700'}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-black font-sans block tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {s.totalEarnings.toLocaleString('uz-UZ')} <span className="text-xs font-bold text-gray-400 font-mono">so'm</span>
            </span>
            <span className={`text-[10px] mt-2 inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded ${
              isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100/70 text-indigo-800'
            }`}>
              💵 Tasdiqlangan hisob-kitoblar
            </span>
          </div>
        </div>

      </div>

      {/* Export & Command Center Action Panel - Brutalist/Bold Typography Styled */}
      <div className={`p-6 border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none shrink-0 ${
        isDark ? 'bg-[#111] border-[#252525]' : 'bg-zinc-900 border-zinc-800 text-white shadow-lg'
      }`}>
        <div>
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00FF00] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse"></span> HISOBOT VA EKSPORT MARKAZI
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
            Teplitsa sig'imi, moliya va barcha nuqsonli hisobotlarni PDF yoki Excel formatida saqlang.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 text-xs uppercase font-mono tracking-tight flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-0 rounded-xl shadow-lg hover:shadow-emerald-500/20"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" /> EXCEL (CSV) EKSPORT
          </button>
          <button 
            onClick={() => setShowPrintModal(true)}
            className="flex-1 md:flex-initial bg-zinc-850 hover:bg-zinc-750 text-white font-black px-5 py-3 text-xs uppercase font-mono tracking-tight flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-0 rounded-xl shadow-lg hover:shadow-zinc-700/20"
          >
            <Printer className="h-4.5 w-4.5 shrink-0" /> PDF CHOP ETISH
          </button>
        </div>
      </div>

      {/* Main Grid: Left lists & Right defects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Greenhouse lists Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#111111] border-[#222222]' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-[#222] pb-4">
              <div>
                <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-950'}`}>
                  Lokatsiyalar bo’yicha ko’chat sig’imi monitoringi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">6 ta issiqxona va 2 ta ochiq daladagi bandlik darajasi</p>
              </div>
              <button 
                onClick={fetchReport} 
                className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDark 
                    ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/40' 
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100'
                }`}
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
                    ? 'bg-emerald-600 text-white border-emerald-555 shadow-sm' 
                    : isDark 
                      ? 'bg-[#181818] text-gray-300 border-[#2b2b2b] hover:bg-[#222222]' 
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
                      ? 'bg-emerald-600 text-white border-emerald-555 shadow-sm' 
                      : isDark
                        ? 'bg-[#181818] text-gray-300 border-[#2b2b2b] hover:bg-[#222222]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {/* Location Bars */}
            <div className="space-y-4">
              {filteredLocationStats.map((loc: any) => (
                <div key={loc.id} className={`p-4 rounded-xl border transition-all ${
                  isDark ? 'border-[#1e1e1e] bg-[#161616] hover:bg-[#1b1b1b]' : 'border-gray-50 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-sm flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${loc.type === 'greenhouse' ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
                      {loc.name}
                      <span className="text-xs font-normal text-gray-400 font-mono">({loc.type === 'greenhouse' ? "Issiqxona" : "Ochiq dala"})</span>
                    </span>
                    <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {loc.active + loc.ready} / {loc.capacity} <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>({loc.capacityUsedPercent}%)</span>
                    </span>
                  </div>

                  {/* Visual Bar progress */}
                  <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? 'bg-[#262626]' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        loc.capacityUsedPercent > 85 ? 'bg-red-500' : loc.capacityUsedPercent > 60 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(loc.capacityUsedPercent, 100)}%` }}
                    ></div>
                  </div>

                  <div className={`grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t text-center font-mono text-xs ${isDark ? 'border-zinc-800/40' : 'border-gray-100/50'}`}>
                    <div>
                      <span className="text-gray-405 block text-[10px] uppercase">O'smoqda</span>
                      <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-gray-800'}`}>{loc.active}</span>
                    </div>
                    <div>
                      <span className="text-amber-500 block text-[10px] uppercase">Tayyor</span>
                      <span className="font-bold text-amber-600">{loc.ready}</span>
                    </div>
                    <div>
                      <span className="text-red-400 block text-[10px] uppercase">Nuqson</span>
                      <span className="font-bold text-red-500">{loc.defect}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Recent Defect logs with custom scroll color */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border flex flex-col h-full justify-between transition-all ${
            isDark ? 'bg-[#111111] border-[#222222]' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-[#222] pb-3">
                <h3 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-950'}`}>
                  <ShieldAlert className="text-red-550 h-5 w-5 animate-pulse" /> So'nggi Nuqsonlar (Surat va Izoh)
                </h3>
              </div>

              {defects.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-mono">
                  Sog'lom o'sish - nuqsonlar qayd qilinmagan.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {defects.map(def => (
                    <div key={def.id} className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                      isDark ? 'bg-[#1e1313] border-[#3a1d1d] text-red-200' : 'bg-red-50/50 border-red-100/40 text-red-950'
                    }`}>
                      {def.image ? (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                          <img src={def.image} alt="Defect" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-red-100/50 text-red-600 font-mono text-xs uppercase shrink-0 flex items-center justify-center font-bold">
                          RASM
                        </div>
                      )}
                      <div className="space-y-1 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isDark ? 'bg-zinc-900 border-[#4a2323] text-red-400' : 'bg-white border-gray-100'
                          }`}>{def.plant_code}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{new Date(def.date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <p className={`font-sans font-medium leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{def.notes}</p>
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
            <div className={`mt-5 p-4 rounded-xl text-xs leading-relaxed space-y-1 ${
              isDark ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-emerald-55/70 text-emerald-950 border border-emerald-100/70'
            }`}>
              <span className="font-bold flex items-center gap-1"><Thermometer className="h-4 w-4" /> Boshqaruv Ma'lumoti:</span>
              <p>Har qanday nav o'zgarishi, qabul qilish yoki nuqson belgisi skanerlash moduli orqali amalga oshirilganda bu yerga kelib tushadi.</p>
            </div>
          </div>
        </div>

      </div>

      {/* 
        ========================================================================
        NEW SECTION AND GOAL IMPLEMENTED: INNOVATION, EXTENSIONS AND IDEAS HUB
        Persisted on LocalStorage, beautiful color filters, and dynamic user voting
        ========================================================================
      */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Lightbulb className="h-5 w-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              💡 Yashil Ko'chat Tizimini Rivojlantirish & G'oyalar Markazi
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Foydalanuvchilar tomonidan kiritilgan smart teplitsani kengaytirish bo'yicha eng yaxshi taklif va innovatsiyalar portali.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-amber-500 hover:bg-amber-600 font-bold font-mono text-xs uppercase px-4 py-2 text-white flex items-center gap-1.5 transition-all duration-200 cursor-pointer rounded-xl"
            >
              <Plus className="h-4 w-4" /> {showAddForm ? "Yopish" : "G'oya Taklif Qilish"}
            </button>
          </div>
        </div>

        {/* Dynamic Add Form with standard agrotech design */}
        {showAddForm && (
          <form onSubmit={handleSubmitIdea} className={`p-5 mb-6 rounded-xl border ${
            isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-amber-50/15 border-amber-100'
          } animate-fadeIn`}>
            <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              <Sparkles className="h-4 w-4 text-amber-500" /> Yangi Texnologik Taklif Kiritish Shakli
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 mb-1">G'oya yoki Taklif Sarlavhasi</label>
                <input 
                  type="text"
                  required
                  placeholder="Masalan: Avtomatik dori sepish datchiklari"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 mb-1">Bo'lim / Kategoriya</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-205 text-gray-900'
                  }`}
                >
                  {ideaCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 mb-1">Batafsil izohi va kutilayotgan texnik foydasi</label>
              <textarea 
                rows={3}
                required
                placeholder="Taklif etayotgan g'oyangiz teplitsa ishlashidagi qaysi muammoni hal qiladi va uning iqtisodiy samaradorligi nimada..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 mb-1">Tizimga Ta'sir Darajasi</label>
                <select
                  value={newImpact}
                  onChange={e => setNewImpact(e.target.value as any)}
                  className={`w-full p-2.2 rounded-lg text-xs font-semibold focus:outline-none ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="Yuqori">Yuqori Ta'sirli</option>
                  <option value="O'rtacha">O'rtacha Ta'sirli</option>
                  <option value="Past">Past Ta'sirli</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 mb-1">Tadbiq Statusi</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className={`w-full p-2.2 rounded-lg text-xs font-semibold focus:outline-none ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="goya">Tizimli G'oya / Ochiq</option>
                  <option value="reja">Rejalashtirilgan (Reja)</option>
                  <option value="jarayonda">Hozirda Tayyorlanmoqda (Active)</option>
                  <option value="kiritildi">Tizimga Tatbiq Etildi</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 mb-1">Ishlab chiqish darajasi (%): {newProgress}%</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={e => setNewProgress(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mt-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase cursor-pointer ${
                  isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bekor Qilish
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase px-4 py-2 rounded-xl cursor-pointer shadow"
              >
                Tizimga Qo'shish & Saqlash
              </button>
            </div>
          </form>
        )}

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-150 dark:border-zinc-800/60 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: "Barcha g'oyalar" },
              { id: 'kiritildi', label: "Kiritilganlar" },
              { id: 'jarayonda', label: "Tayyorlanayotganlar" },
              { id: 'reja', label: "Rejadagilar" },
              { id: 'goya', label: "Faqat G'oyalar" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setIdeaFilter(f.id)}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border cursor-pointer font-bold uppercase transition-all ${
                  ideaFilter === f.id
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/40'
                    : isDark 
                      ? 'bg-[#181818] text-gray-400 border-zinc-800 hover:text-white' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
            JAMI TAKLIFLAR: {ideas.length} ta
          </span>
        </div>

        {/* Ideas Bento-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea, index) => {
            const statusConfig = {
              jarayonda: { name: "Tayyorlanmoqda", style: isDark ? 'bg-blue-950/40 text-blue-400 border border-blue-900/50' : 'bg-blue-50 text-blue-800 border border-blue-100' },
              kiritildi: { name: "Tizimda Mavjud", style: isDark ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 animate-pulse' : 'bg-emerald-50 text-emerald-800 border border-emerald-100' },
              reja: { name: "Rejada bor", style: isDark ? 'bg-purple-950/40 text-purple-400 border border-purple-900/50' : 'bg-purple-50 text-purple-800 border border-[#f3e8ff]' },
              goya: { name: "Ochiq Taklif", style: isDark ? 'bg-zinc-800 text-gray-300 border border-zinc-700' : 'bg-gray-100 text-gray-700 border border-gray-200' },
              bajarildi: { name: "Bajarildi", style: isDark ? 'bg-teal-950/40 text-teal-400 border border-teal-900/50' : 'bg-teal-50 text-teal-800 border border-teal-100' }
            }[idea.status] || { name: idea.status, style: '' };

            const impactStyle = idea.impact === 'Yuqori' 
              ? 'bg-red-500/10 text-red-500 border-red-500/20' 
              : idea.impact === "O'rtacha" 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

            return (
              <div 
                key={idea.id} 
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 relative hover:shadow-lg ${
                  isDark ? 'bg-[#151515] border-[#252525] hover:border-amber-500/30' : 'bg-slate-50/40 border-slate-100 hover:bg-white hover:border-amber-200'
                }`}
              >
                {/* Visual badge indicator inside grid cards */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${statusConfig.style}`}>
                    {statusConfig.name}
                  </span>
                  
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${impactStyle}`}>
                    Ta'sir: {idea.impact}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <h4 className={`text-sm font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {index + 1}. {idea.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {idea.desc}
                  </p>
                </div>

                {/* Progress bar info */}
                <div className="space-y-1 mb-4 select-none">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                    <span>Tayyorgarlik darajasi:</span>
                    <span className="font-mono text-[#00FF00]">{idea.progress}%</span>
                  </div>
                  <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${idea.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Voter and feedback info bar */}
                <div className="flex items-center justify-between pt-3.5 border-t border-dashed border-gray-200 dark:border-zinc-800/80">
                  <div className="text-[10px] text-gray-450">
                    <span className="block font-semibold">Tashabbuskor:</span>
                    <span className="block font-sans text-slate-400 truncate w-28">{idea.author}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVote(idea.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all transform active:scale-95 cursor-pointer ${
                      isDark 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Bu g'oya tizim takomillashishi uchun foydali deb hisoblasangiz ovoz bering!"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 animate-bounce" />
                    <span>{idea.votes}</span>
                  </button>
                </div>
              </div>
            );
          })}
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
            className={`max-w-4xl w-full p-10 space-y-8 select-text relative border-2 ${
              isDark 
                ? 'bg-[#0a0a0a] text-zinc-100 border-zinc-800' 
                : 'bg-white text-slate-800 border-slate-350 shadow-xl'
            } print-black-border print-bg-gray`}
          >
            {/* Header section matches Terminal / Corporate aesthetic */}
            <header className={`flex justify-between items-start border-b-2 border-dashed pb-6 ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <div>
                <h1 className={`text-3xl font-black tracking-widest uppercase leading-none pb-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Yashil Ko'chat MChJ
                </h1>
                <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">
                  TOSHKENT MARKAZIY BOSHQARUV TIZIMI v1.0
                </p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase">
                  Obyektlar: 6 ta issiqxona va 2 ta ochiq dala monitoringi
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">HISOBOT RAQAMI: #MON-{new Date().toISOString().slice(2, 10).replace(/-/g, '')}</p>
                <p className={`text-xs font-bold mt-1 uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>SANA: {new Date().toLocaleDateString('uz-UZ')}</p>
                <p className="text-[10px] text-gray-450 mt-1 uppercase font-mono">STATUS: AKTIV GURUH</p>
                <p className="text-[10px] text-gray-450 mt-0.5 uppercase font-mono">XALQARO METRIKA: SI-SYSTEM</p>
              </div>
            </header>

            {/* Overall summaries */}
            <section className="space-y-4">
              <h3 className={`text-sm font-black uppercase tracking-wider text-emerald-500 border-b pb-1.5 ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}>
                I. UMUMIY METRIKALAR XULOSASI (METRICS SUMMARY)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 border text-center ${isDark ? 'bg-zinc-950/40 border-zinc-850' : 'bg-slate-50 border-slate-200/60'}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Jarayonda (Tirik)</span>
                  <span className={`text-2xl font-black block mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{s.activeCount} ta</span>
                </div>
                <div className={`p-4 border text-center ${isDark ? 'bg-zinc-950/40 border-[#153a15]' : 'bg-emerald-50/20 border-emerald-150'}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-emerald-800'}`}>Sotuvga Tayyor</span>
                  <span className="text-2xl font-black text-emerald-600 block mt-1">{s.readyCount} ta</span>
                </div>
                <div className={`p-4 border text-center ${isDark ? 'bg-zinc-950/40 border-[#3c1a1a]' : 'bg-red-50/25 border-red-150'}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-550' : 'text-red-800'}`}>No-bud (Nuqsonlar)</span>
                  <span className="text-2xl font-black text-red-500 block mt-1">{s.defectCount} ta</span>
                </div>
                <div className={`p-4 border text-center ${isDark ? 'bg-zinc-950/40 border-zinc-850' : 'bg-slate-50 border-slate-200/60'}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Tasdiqlangan Moliya</span>
                  <span className={`text-lg font-black block mt-2 truncate w-full ${isDark ? 'text-zinc-100' : 'text-slate-905'}`}>{s.totalEarnings.toLocaleString('uz-UZ')} so'm</span>
                </div>
              </div>
            </section>

            {/* Mid-level Capacity metrics list */}
            <section className="space-y-4">
              <h3 className={`text-sm font-black uppercase tracking-wider text-emerald-500 border-b pb-1.5 ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}>
                II. LOKATSIYAVIY MONITORING NATORIYATI (INFRASTRUCTURE LOAD)
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-350 text-slate-500'}`}>
                    <th className="py-2.5 font-bold">LOKATSIYA NOMI</th>
                    <th className="py-2.5 font-bold">TURI</th>
                    <th className="py-2.5 text-right font-bold">HAMMASI (FOIZ)</th>
                    <th className="py-2.5 text-right font-bold">O'SMOQDA (ACTIVE)</th>
                    <th className="py-2.5 text-right font-bold">TAYYOR (READY)</th>
                    <th className="py-2.5 text-right font-bold">NUQSONLAR</th>
                    <th className="py-2.5 text-right font-bold">Maksimal Sig'im</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-900' : 'divide-slate-200/60'}`}>
                  {report.locationStats.map((loc: any) => (
                    <tr key={loc.id} className={`${isDark ? 'text-zinc-300 hover:bg-zinc-900/40' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <td className="py-2.5 font-bold flex items-center gap-1">
                        ■ {loc.name}
                      </td>
                      <td className={`py-2.5 uppercase font-mono text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        {loc.type === 'greenhouse' ? 'Teplitsa' : 'Ochiq dala'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {loc.capacityUsedPercent}%
                      </td>
                      <td className={`py-2.5 text-right ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        {loc.active}
                      </td>
                      <td className="py-2.5 text-right text-emerald-500 font-bold">
                        {loc.ready}
                      </td>
                      <td className="py-2.5 text-right text-red-500 font-bold">
                        {loc.defect}
                      </td>
                      <td className={`py-2.5 text-right font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        {loc.capacity} ta
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Last defects database */}
            <section className="space-y-4">
              <h3 className={`text-sm font-black uppercase tracking-wider text-emerald-500 border-b pb-1.5 ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}>
                III. FAOL QAYD ETILGAN NUQSONLAR VA NO-BUDLAR
              </h3>
              {defects.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Hozircha tizimda hech qanday no-budlar qayd etilmagan.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-350 text-slate-500'}`}>
                      <th className="py-2.5">O'SIMLIK KODI</th>
                      <th className="py-2.5">KAYD SANASI</th>
                      <th className="py-2.5">LOKATSIYASI</th>
                      <th className="py-2.5">PARTIYASI</th>
                      <th className="py-2.5">MUAMMO BATAFSIL / IZOHI</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-900' : 'divide-slate-200/60'}`}>
                    {defects.slice(0, 15).map((def: any) => (
                      <tr key={def.id} className={`${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <td className="py-2.5 font-bold text-red-500">
                          {def.plant_code}
                        </td>
                        <td className={`py-2.5 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {new Date(def.date).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className={`py-2.5 uppercase font-mono text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {def.location_name}
                        </td>
                        <td className={`py-2.5 font-bold font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {def.batch_code}
                        </td>
                        <td className={`py-2.5 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {def.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Verification Stamper and Footer Signature boxes */}
            <footer className={`pt-16 border-t-2 border-dashed grid grid-cols-2 md:grid-cols-3 gap-8 text-[11px] uppercase tracking-wide ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}>
              <div>
                <p className={`${isDark ? 'text-zinc-400' : 'text-slate-500'} font-mono`}>Mas'ul Shaxs:</p>
                <div className={`h-10 mt-2 border-b ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}></div>
                <p className={`mt-2 font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Bosh Agronom Imzosi</p>
              </div>

              <div>
                <p className={`${isDark ? 'text-zinc-400' : 'text-slate-500'} font-mono`}>Tekshirildi:</p>
                <div className={`h-10 mt-2 border-b ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}></div>
                <p className={`mt-2 font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Hisobchi / Administrator</p>
              </div>

              <div className={`col-span-2 md:col-span-1 border border-dashed p-4 text-center text-[9px] font-mono flex flex-col justify-center items-center ${
                isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-300 text-slate-500'
              }`}>
                <p className={`font-bold mb-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>RAQAMLI MUHR / SECURE SHA2</p>
                <p>CERTIFIED SYSTEM AUTOMATION v1</p>
                <p className="text-emerald-500 font-black mt-2">● SECURE_ENCR_OK</p>
              </div>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}
