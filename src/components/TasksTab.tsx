import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Task, User } from '../types';
import { ClipboardList, Plus, Clock, CheckCircle2, X, RefreshCw, AlertTriangle, Bell, ShieldAlert, Check, BarChart as BarChartIcon, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface TasksTabProps {
  userId: number;
  userRole: string;
  quarantinedShelves?: number[];
  toggleShelfQuarantine?: (shelfId: number) => void;
}

export default function TasksTab({ userId, userRole, quarantinedShelves, toggleShelfQuarantine }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState<number>(0);
  const [deadline, setDeadline] = useState('');

  // Local notifications / alerts state
  const [notifications, setNotifications] = useState<string[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  // Filter state for active vs archived views
  const [vazifaUslubi, setVazifaUslubi] = useState<'active' | 'archived' | 'all'>('active');

  // The fixed reference date in application context is 2026-05-25
  const TODAY_STR = "2026-05-25";
  const today = new Date(TODAY_STR);

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      // Background Cleanup Job: silently archive any completed tasks older than 30 days
      try {
        await api.cleanupTasks();
      } catch (cleanError) {
        console.warn("Background task cleanup failed silently:", cleanError);
      }

      const isPrivileged = userRole === 'admin' || userRole === 'director' || userRole === 'head_agronomist';
      const list = await api.getTasks(isPrivileged ? undefined : userId);
      setTasks(list);

      const uList = await api.getUsers();
      setUsers(uList);

      // Generate smart notifications based on deadlines
      const systemAlerts: string[] = [];
      list.forEach(task => {
        if (task.status !== 'done') {
          const taskDate = new Date(task.deadline);
          const timeDiff = taskDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          const assignedUser = uList.find(u => u.id === task.assigned_to)?.name || 'Xodim';

          if (daysDiff < 0) {
            systemAlerts.push(`⚠️ DIQQAT: "${task.title}" topshirig'i muddati o'tib ketgan! (${assignedUser})`);
          } else if (daysDiff === 0) {
            systemAlerts.push(`🚨 TEZKOR: "${task.title}" topshirig'i bugun yakunlanishi shart! (${assignedUser})`);
          } else if (daysDiff <= 2) {
            systemAlerts.push(`⏰ OGOHLANTIRISH: "${task.title}" topshiriq muddati oz qoldi! (${daysDiff} kun qoldi, ${assignedUser})`);
          }
        }
      });
      setNotifications(systemAlerts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundCleanup = async () => {
    if (!window.confirm("Barcha 30 kundan oshgan yakunlangan topshiriqlarni arxivga ko'chirishni tasdiqlaysizmi?")) {
      return;
    }
    try {
      const res = await api.cleanupTasks();
      if (res.success) {
        alert(`Muvaffaqiyatli yakunlandi! ${res.count} ta muddati o'tgan bajarilgan vazifa arxivga yo'naltirildi.`);
        fetchTasksData();
      }
    } catch (e) {
      console.error(e);
      alert("Xatolik ro'y berdi.");
    }
  };

  const handleToggleArchive = async (id: number, isArchived: boolean) => {
    try {
      await api.archiveTask(id, isArchived);
      fetchTasksData();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !deadline) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    try {
      await api.createTask({
        title,
        description: desc,
        assigned_to: Number(assignedTo),
        assigned_by: userId,
        deadline
      });

      setShowTaskModal(false);
      setTitle('');
      setDesc('');
      setAssignedTo(0);
      setDeadline('');
      fetchTasksData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.updateTaskStatus(id, status);
      fetchTasksData();
    } catch (e) {
      console.error(e);
    }
  };

  const notifyUserInApp = (msg: string) => {
    // Add real-time dismissible notification Simulation
    alert(msg);
  };

  // Helper to compute details of task deadline
  const getDeadlineStatus = (deadlineStr: string, status: string) => {
    if (status === 'done') {
      return { label: "Bajarilgan", style: "border-[#00FF00] text-[#00FF00] bg-emerald-950/20", daysRemaining: 0, priority: "normal", indicator: "●" };
    }

    const taskDate = new Date(deadlineStr);
    const timeDiff = taskDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { 
        label: `MUDDATI O'TGAN (${Math.abs(daysDiff)} KUN KESHIKDI)`, 
        style: "border-red-600 text-red-500 bg-red-950/30 animate-pulse", 
        daysRemaining: daysDiff, 
        priority: "CRITICAL", 
        indicator: "▲ Xavf" 
      };
    } else if (daysDiff === 0) {
      return { 
        label: "BUGUN OXIRGI MUDDAT", 
        style: "border-[#ffea00] text-[#ffea00] bg-[#ffea00]/10 animate-bounce", 
        daysRemaining: 0, 
        priority: "HIGH", 
        indicator: "⚠️ Bugun" 
      };
    } else if (daysDiff <= 2) {
      return { 
        label: `MUDDAT YAQIN (${daysDiff} KUN QOLDI)`, 
        style: "border-[#ffaa00] text-[#ffaa00] bg-[#ffaa00]/10", 
        daysRemaining: daysDiff, 
        priority: "MEDIUM", 
        indicator: "⏰ Tezda" 
      };
    } else {
      return { 
        label: `${daysDiff} kun vaqt bor`, 
        style: "border-[#333333] text-[#A0A0A0] bg-neutral-900/10", 
        daysRemaining: daysDiff, 
        priority: "LOW", 
        indicator: "✓ Aktiv" 
      };
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'director' || userRole === 'head_agronomist';

  // Statistics calculations for the brutalist side panel
  const overdueCount = tasks.filter(t => t.status !== 'done' && new Date(t.deadline).getTime() < today.getTime()).length;
  const approachingCount = tasks.filter(t => {
    if (t.status === 'done') return false;
    const days = Math.ceil((new Date(t.deadline).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return days >= 0 && days <= 2;
  }).length;
  const totalIncomplete = tasks.filter(t => t.status !== 'done').length;

  // Real-time KPI Overview dashboard calculations
  const activeTasksCount = tasks.filter(t => t.status !== 'done' && !t.is_archived).length;
  const completedTodayCount = tasks.filter(t => t.status === 'done' && !t.is_archived).length;
  const activeCycleTasksCount = tasks.filter(t => !t.is_archived).length;
  const completedCycleCount = tasks.filter(t => t.status === 'done' && !t.is_archived).length;
  const efficiencyScore = activeCycleTasksCount > 0 ? Math.round((completedCycleCount / activeCycleTasksCount) * 100) : 0;

  // Custom function to compute task completion rates per employee
  const computeEmployeePerformance = () => {
    const performanceMap: Record<number, { name: string; role: string; total: number; done: number }> = {};
    
    // Seed performance metrics for available employees
    users.forEach(u => {
      if (u.role !== 'director' && u.role !== 'admin') {
        performanceMap[u.id] = { name: u.name, role: u.role, total: 0, done: 0 };
      }
    });

    tasks.forEach(task => {
      const uId = task.assigned_to;
      if (performanceMap[uId]) {
        performanceMap[uId].total += 1;
        if (task.status === 'done') {
          performanceMap[uId].done += 1;
        }
      } else {
        const assigneeUser = users.find(u => u.id === uId);
        if (assigneeUser) {
          performanceMap[uId] = {
            name: assigneeUser.name,
            role: assigneeUser.role,
            total: 1,
            done: task.status === 'done' ? 1 : 0
          };
        }
      }
    });

    return Object.values(performanceMap)
      .filter(p => p.total > 0)
      .map(p => {
        const rate = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
        return {
          name: p.name,
          role: p.role,
          displayName: `${p.name} (${p.role.replace('_', ' ').toUpperCase()})`,
          'Bajarilgan': rate,
          'Jami': p.total,
          'Yopilgan': p.done,
        };
      });
  };

  const performanceData = computeEmployeePerformance();

  // Custom brutalist tooltip matching theme rules
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#111111] border-2 border-emerald-500 dark:border-[#00FF00] p-3 text-[11px] font-mono shadow-md">
          <p className="font-black text-slate-900 dark:text-white mb-1 uppercase text-xs">{label}</p>
          <div className="space-y-1 mt-1 text-slate-700 dark:text-[#A0A0A0]">
            <div>Lavozimi: <span className="font-bold text-slate-950 dark:text-white uppercase">{data.role.replace('_', ' ')}</span></div>
            <div>Ko'rsatkich: <span className="font-extrabold text-emerald-600 dark:text-[#00FF00]">{payload[0].value}% bajarilgan</span></div>
            <div className="text-[10px] text-slate-500 dark:text-gray-500">Jami topshiriqlar: {data.Jami} ta ({data.Yopilgan} ta yopilgan)</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Visual Threat & Alarm Notification System Banner */}
      {notifications.length > 0 && (
        <div className="border border-red-900/40 bg-[#161212] p-5 rounded-none flex flex-col md:flex-row gap-5 items-start md:items-center justify-between select-none">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 shrink-0 bg-red-500/10 border border-red-500 rounded-none flex items-center justify-center text-red-500 animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-500" /> TIZIM OGOHLANTIRISHLARI / ALARMS
              </h3>
              <p className="text-[10px] text-[#A2A2A2] font-mono mt-1">
                TEPLITSA topshiriqlarida yaqinlashayotgan yoki muddatidan o'tgan jarayon aniqlandi:
              </p>
              <ul className="mt-3 space-y-1.5 list-none pl-0">
                {notifications.slice(0, 4).map((note, index) => (
                  <li key={index} className="text-xs text-[#E0E0E0] font-mono flex items-start gap-2">
                    <span className="text-red-500 shrink-0">■</span>
                    <span>{note}</span>
                  </li>
                ))}
                {notifications.length > 4 && (
                  <li className="text-[10px] text-gray-500 font-mono italic pl-4">
                    va yana {notifications.length - 4} ta shoshilinch ogohlantirishlar mavjud...
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="self-end md:self-center shrink-0">
            <span className="text-[10px] font-mono px-3 py-1.5 border border-red-500/40 text-red-500 bg-red-500/5 animate-pulse rounded-none">
              SISTEMA XAVF DARAJASI: CRITICAL
            </span>
          </div>
        </div>
      )}

      {/* Real-time KPI Dashboard Overview Grid */}
      <div id="tasks-kpi-dashboard" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        
        {/* KPI Panel: Active Tasks */}
        <div id="kpi-card-active-tasks" className="p-6 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 dark:hover:border-blue-500/55 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-[#888888]">
                Faol Vazifalar
              </span>
              <div className="p-2 bg-blue-500/10 text-blue-500 border border-blue-500/10 dark:border-blue-500/20">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
                {activeTasksCount}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-[#666] uppercase">
                ta faol
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#222222] flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400 dark:text-[#666] uppercase">Muhlati o'tgan:</span>
            <span className={`font-bold uppercase ${overdueCount > 0 ? 'text-red-500 animate-pulse font-black' : 'text-slate-500 dark:text-[#888]'}`}>
              {overdueCount} ta yuklama
            </span>
          </div>

          {/* Toggle Quarantine Control integration */}
          <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-[#222222]">
            <button
              onClick={() => {
                if (toggleShelfQuarantine) {
                  toggleShelfQuarantine(6);
                }
              }}
              className={`w-full py-2.5 px-3.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all duration-200 cursor-pointer ${
                quarantinedShelves?.includes(6)
                  ? 'bg-rose-500/15 border-rose-500/35 text-rose-500 hover:bg-rose-500/25 hover:border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 hover:border-rose-500/35 hover:bg-rose-500/5 hover:shadow-md'
              }`}
              title="6-javondagi karantin holatini boshqarish"
            >
              <AlertTriangle className={`h-4 w-4 shrink-0 transition-transform ${quarantinedShelves?.includes(6) ? 'text-rose-500 animate-[bounce_1s_infinite]' : 'text-zinc-400 group-hover:text-rose-400'}`} />
              <span>
                {quarantinedShelves?.includes(6) ? "Karantin: FAOL (Javon 6)" : "Karantinni Yoqish (Javon 6)"}
              </span>
            </button>
            <p className="mt-1.5 text-[9px] text-zinc-400 text-center font-mono uppercase tracking-tight">
              {quarantinedShelves?.includes(6) 
                ? "⚠️ Yon-atrof javonlar xavf ostida!" 
                : "Oddiy ish tartibi faollashtirilgan"}
            </p>
          </div>
        </div>

        {/* KPI Panel: Completed Today */}
        <div id="kpi-card-completed-today" className="p-6 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 dark:hover:border-emerald-500/55 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-[#888888]">
                Bajarilganlar (Sikl)
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 dark:border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
                {completedTodayCount}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-[#666] uppercase">
                bajarildi
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#222222] flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400 dark:text-[#666] uppercase">Arxivlanganlar:</span>
            <span className="font-bold text-amber-500 uppercase">
              {tasks.filter(t => t.is_archived).length} ta jami
            </span>
          </div>
        </div>

        {/* KPI Panel: Completion Efficiency Score */}
        <div id="kpi-card-efficiency-score" className="p-6 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 dark:hover:border-emerald-500/55 transition-all duration-300">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
            efficiencyScore >= 80 ? 'from-emerald-500 to-teal-500' :
            efficiencyScore >= 50 ? 'from-amber-500 to-orange-500' :
            'from-red-500 to-rose-500'
          }`}></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-[#888888]">
                Sikl Samaradorligi
              </span>
              <div className={`p-2 border ${
                efficiencyScore >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10 dark:border-emerald-500/20' :
                efficiencyScore >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/10 dark:border-amber-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/10 dark:border-red-500/20'
              }`}>
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
                  {efficiencyScore}%
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-[#666] uppercase">
                  koeffitsiyent
                </span>
              </div>
              
              <div className="mt-3 w-full bg-slate-100 dark:bg-[#222222] h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    efficiencyScore >= 80 ? 'bg-emerald-500' :
                    efficiencyScore >= 50 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${efficiencyScore}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#222222] flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400 dark:text-[#666] uppercase">Faol sikl yuklamalari:</span>
            <span className="font-bold text-slate-700 dark:text-white">
              {completedCycleCount} / {activeCycleTasksCount} yopildi
            </span>
          </div>
        </div>

      </div>

      {/* Task Performance Oversight Dashboard Widget */}
      <div className="p-6 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#222222] pb-4 mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-[#00FF00] border border-emerald-100 dark:border-emerald-800/20 px-2 py-1 tracking-wider inline-block mb-2 rounded-none">
              BASHARAT VA IJRO MONITORI
            </span>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-emerald-600 dark:text-[#00FF00]" /> Vazifalar Bajarilish Samaradorligi Kesimi
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-sans mt-0.5">
              Mas'ul xodimlar va lavozimlar kesimida vazifalar yakunlanishi koeffitsiyenti
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-xs">
              <span className="w-2.5 h-2.5 bg-[#ef4444] inline-block"></span>
              <span className="text-slate-600 dark:text-gray-400 uppercase font-bold">Quyi (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-xs">
              <span className="w-2.5 h-2.5 bg-[#f59e0b] inline-block"></span>
              <span className="text-slate-600 dark:text-gray-400 uppercase font-bold">O'rta (50% - 79%)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#222] text-xs">
              <span className="w-2.5 h-2.5 bg-[#10b981] inline-block"></span>
              <span className="text-slate-600 dark:text-gray-400 uppercase font-bold">A'lo (≥80%)</span>
            </div>
          </div>
        </div>

        {performanceData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-gray-500 font-mono text-xs uppercase tracking-widest">
            Vazifalar tarixi yetarli emas. Baza diagrammasini ko'rsatish uchun kamida bitta vazifa bo'lishi lozim.
          </div>
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#222222' : '#cbd5e1'} vertical={false} />
                <XAxis 
                  dataKey="displayName" 
                  tick={{ fill: document.documentElement.classList.contains('dark') ? '#A0A0A0' : '#475569', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                  axisLine={{ stroke: document.documentElement.classList.contains('dark') ? '#222222' : '#cbd5e1' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: document.documentElement.classList.contains('dark') ? '#A0A0A0' : '#475569', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: document.documentElement.classList.contains('dark') ? '#222222' : '#cbd5e1' }}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                <Bar dataKey="Bajarilgan" radius={[4, 4, 0, 0]} barSize={40}>
                  {
                    performanceData.map((entry, index) => {
                      let color = '#ef4444'; // Red for low
                      if (entry.Bajarilgan >= 80) color = '#10b981'; // Emerald for high
                      else if (entry.Bajarilgan >= 50) color = '#f59e0b'; // Amber for mid
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid: 12 Columns brutalist layout design */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Side: Tasks list (col-span-8) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#222222] pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <ClipboardList className="text-[#00FF00] h-6 w-6" /> Korporativ Yuklamalar
              </h2>
              <p className="text-xs text-[#888888] font-mono mt-1 uppercase tracking-wider">
                Bugungi monitoring sanasi: {TODAY_STR}
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowTaskModal(true)}
                className="bg-[#E0E0E0] hover:bg-[#00FF00] text-[#0A0A0A] text-xs font-black uppercase px-4 py-2.5 rounded-none border border-transparent transition-colors cursor-pointer select-none tracking-tighter"
              >
                + YANGI ISH YUKLASH
              </button>
            )}
          </div>

          {/* Filter Navigation Segment & Administrative Cleanup Tool */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] p-3 text-xs">
            <div className="flex flex-wrap gap-2 animate-fade-in">
              <button
                onClick={() => setVazifaUslubi('active')}
                className={`px-3 py-1.5 font-mono font-bold uppercase tracking-tight text-[10px] rounded-none border transition-colors cursor-pointer ${
                  vazifaUslubi === 'active'
                    ? 'bg-emerald-600 dark:bg-[#00FF00] text-white dark:text-[#0a0a0a] border-transparent'
                    : 'bg-white dark:bg-black text-slate-600 dark:text-[#888888] border-slate-200 dark:border-[#333333] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Faol ({tasks.filter(t => !t.is_archived).length} ta)
              </button>
              <button
                onClick={() => setVazifaUslubi('archived')}
                className={`px-3 py-1.5 font-mono font-bold uppercase tracking-tight text-[10px] rounded-none border transition-colors cursor-pointer ${
                  vazifaUslubi === 'archived'
                    ? 'bg-amber-600 dark:bg-[#ffea00] text-white dark:text-[#0a0a0a] border-transparent'
                    : 'bg-white dark:bg-black text-slate-600 dark:text-[#888888] border-slate-200 dark:border-[#333333] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Arxivlangan ({tasks.filter(t => t.is_archived).length} ta)
              </button>
              <button
                onClick={() => setVazifaUslubi('all')}
                className={`px-3 py-1.5 font-mono font-bold uppercase tracking-tight text-[10px] rounded-none border transition-colors cursor-pointer ${
                  vazifaUslubi === 'all'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white border-transparent'
                    : 'bg-white dark:bg-black text-slate-600 dark:text-[#888888] border-slate-200 dark:border-[#333333] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Barchasi ({tasks.length} ta)
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={handleBackgroundCleanup}
                className="bg-red-500/15 dark:bg-red-950/20 hover:bg-red-650 dark:hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 text-[10px] font-mono font-black uppercase px-3 py-1.5 border border-red-500/30 transition-all cursor-pointer select-none"
                title="30 kundan eski bo'lgan bajarilgan barcha topshiriqlarni arxivga ko'chirish"
              >
                🧹 AUTO-ARCHIVE (30+ KUN)
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-[#00FF00]" />
              YUKLANMOQDA...
            </div>
          ) : tasks.filter(task => {
              if (vazifaUslubi === 'active') return !task.is_archived;
              if (vazifaUslubi === 'archived') return !!task.is_archived;
              return true;
            }).length === 0 ? (
            <div className="bg-[#111111] p-16 text-center rounded-none border-2 border-dashed border-[#222222] text-[#666] font-mono text-xs uppercase tracking-widest">
              Ushbu bo'limda hech qanday topshiriqlar mavjud emas.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.filter(task => {
                if (vazifaUslubi === 'active') return !task.is_archived;
                if (vazifaUslubi === 'archived') return !!task.is_archived;
                return true;
              }).map((task, i) => {
                const assignee = users.find(u => u.id === task.assigned_to);
                const assigner = users.find(u => u.id === task.assigned_by);
                const deadlineInfo = getDeadlineStatus(task.deadline, task.status);

                return (
                  <div 
                    key={task.id} 
                    className={`group bg-[#111111] p-6 rounded-none border-2 transition-colors duration-300 ${
                      task.status === 'done' 
                        ? 'border-[#222222] opacity-80' 
                        : deadlineInfo.priority === 'CRITICAL' 
                          ? 'border-red-900/60 hover:border-red-500' 
                          : deadlineInfo.priority === 'HIGH'
                            ? 'border-[#ffea00]/40 hover:border-[#ffea00]'
                            : 'border-[#222222] hover:border-[#00FF00]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        {/* Task Metadata line */}
                        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] text-[#888888] uppercase tracking-widest">
                          <span className="text-[#333] font-black">{String(i + 1).padStart(2, '0')}</span>
                          <span>|</span>
                          <span className="text-white">Ijro guruhi:</span>
                          <span className="text-white font-bold">{assignee ? `${assignee.name} (${assignee.role.toUpperCase()})` : 'Markaz'}</span>
                          <span>←</span>
                          <span>Biriktirdi: {assigner ? assigner.name : 'Sistema'}</span>
                        </div>

                        {/* Title and description */}
                        <h3 className="text-lg font-bold text-white tracking-tight uppercase group-hover:text-[#00FF00] transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-xs text-[#A0A0A0] leading-relaxed font-sans max-w-2xl bg-[#0d0d0d] p-3 border border-[#222] text-justify rounded-none">
                          {task.description}
                        </p>

                        {/* Interactive Timeline progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-mono text-[#666] uppercase">
                            <span>IJRO TIMELINE STATUSI</span>
                            <span className="font-bold text-white">{deadlineInfo.priority} URGENCY</span>
                          </div>
                          <div className="w-full bg-[#1e1e1e] h-2 border border-[#333] rounded-none overflow-hidden relative">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                task.status === 'done' 
                                  ? 'bg-[#00FF00]' 
                                  : task.status === 'in_progress' 
                                    ? 'bg-[#ffea00] w-2/3 animate-pulse' 
                                    : 'bg-red-600 w-1/3'
                              }`}
                              style={{ 
                                width: task.status === 'done' ? '100%' : task.status === 'in_progress' ? '65%' : '15%' 
                              }}
                            />
                          </div>
                        </div>

                        {/* Clock / Deadline badge with bright red highlight if approaching */}
                        <div className="flex flex-wrap items-center gap-4 pt-1">
                          <div className="flex items-center gap-2 font-mono text-[10px] bg-black border border-[#222] px-3 py-1.5 text-white">
                            <Clock className="h-3.5 w-3.5 text-red-500" />
                            <span>MUDDAT:</span>
                            <span className="font-black text-red-500">{task.deadline} GACHA</span>
                          </div>

                          <span className={`font-mono text-[9px] px-3 py-1 border uppercase font-bold tracking-widest ${deadlineInfo.style}`}>
                            {deadlineInfo.indicator} {deadlineInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Control states for worker role on assignee side */}
                      <div className="flex md:flex-col justify-end items-end gap-2 self-start md:self-auto shrink-0 pt-2">
                        {task.assigned_to === userId && (
                          <div className="flex gap-2">
                            {task.status === 'open' && (
                              <button 
                                onClick={() => {
                                  updateStatus(task.id, 'in_progress');
                                  notifyUserInApp(`"${task.title}" topshirig'ini bajarishni boshladingiz.`);
                                }}
                                className="text-[10px] font-mono font-black uppercase bg-[#ffea00] border border-[#ffea00] text-[#0A0A0A] hover:bg-white hover:text-black py-2 px-3 tracking-tighter cursor-pointer transition-colors"
                              >
                                BOSHLASH ►
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button 
                                onClick={() => {
                                  updateStatus(task.id, 'done');
                                  notifyUserInApp(`Tabriklaymiz! "${task.title}" muvaffaqiyatli yakunlandi.`);
                                }}
                                className="text-[10px] font-mono font-black uppercase bg-[#00FF00] border border-[#00FF00] text-[#0A0A0A] hover:bg-white hover:text-black py-2 px-3 tracking-tighter flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> YAKUNLASH ✓
                              </button>
                            )}
                          </div>
                        )}

                        {task.status === 'done' && (
                          <div className="flex flex-col gap-1.5 items-end">
                            <div className="text-[9px] font-mono text-[#00FF00] bg-emerald-950/20 px-3 py-1.5 border border-[#00FF00]/40 uppercase tracking-widest flex items-center gap-1">
                              ✓ YAKUNLANDI (BAJARILDI)
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleToggleArchive(task.id, !task.is_archived)}
                                className={`text-[9.5px] font-mono uppercase font-black tracking-tight px-3 py-1 mt-1.5 border transition-colors cursor-pointer ${
                                  task.is_archived
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black'
                                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                              >
                                {task.is_archived ? "📂 Arxivdan chiqarish" : "📦 Arxivlash"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Brutalist Statistics Metrika Panel (col-span-4) */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#111111] p-6 border-2 border-[#222222] h-full flex flex-col justify-between">
            <div className="space-y-6">
              
              <div>
                <h3 className="text-[#555] text-[10px] uppercase tracking-widest mb-4 font-mono">TIZIM METRIKASI</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white">{tasks.length}</span>
                  <span className="text-xl font-light text-[#555]">vazifa</span>
                </div>
                <p className="text-[9px] text-[#888888] mt-2 uppercase font-mono">Umumiy yuklatilgan vazifalar soni</p>
              </div>

              <div className="h-px bg-[#222222] w-full"></div>

              <div className="space-y-4">
                <h3 className="text-[#555] text-[10px] uppercase tracking-widest mb-2 font-mono">TEZKOR STATUS XULOSASI</h3>
                
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-red-500">■ MUDDATI O'TGANLAR:</span>
                  <span className="font-bold text-red-500 text-sm">{overdueCount} ta</span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#ffea00]">■ YAQLINLASHAYOTGANLAR (2 KUN):</span>
                  <span className="font-bold text-[#ffea00] text-sm">{approachingCount} ta</span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-400">■ JARAYONDAGILAR (AKTIV):</span>
                  <span className="font-bold text-white text-sm">{totalIncomplete} ta</span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#00FF00]">■ TAYYOR BO'LGANLAR:</span>
                  <span className="font-bold text-[#00FF00] text-sm">
                    {tasks.filter(t => t.status === 'done').length} ta
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-amber-500">■ ARXIVLANGANLAR:</span>
                  <span className="font-bold text-amber-500 text-sm">
                    {tasks.filter(t => t.is_archived).length} ta
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#222222] w-full"></div>

              <div>
                <h3 className="text-[#555] text-[10px] uppercase tracking-widest mb-2 font-mono">AVTOMATLASHGAN MEZON</h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Har bir agronom, laborant yoki hisobchi uchun yuklatilgan va ko'chat ekish normativlariga tegishli vazifalar bu erda hisobga olinadi. Muddatlar qat'iy tekshiriladi.
                </p>
              </div>

            </div>

            <div className="pt-8 block">
              <div className="p-4 bg-[#0A0A0A] border border-[#222222] text-center">
                <span className="text-[9px] font-mono text-[#555] block mb-1">XODIMNING BUGUNGI REJASI</span>
                <span className="text-xs font-bold font-mono text-[#00FF00]">FAOL VA NAZORAT OSTIDA</span>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* --- CREATING TASK MODAL (BRUTALIST / BOLD TYPOGRAPHY STYLE) --- */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111111] border-2 border-[#333333] max-w-md w-full p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">XODIMLARGA ISH YUKLASH</h3>
            <p className="text-[10px] text-[#888888] font-mono uppercase tracking-widest mb-6 border-b border-[#222] pb-3">
              YUKLAMA NORMASI VA EKISH BOSQICHI TOP-DIAGRAMMASI
            </p>

            <form onSubmit={handleCreateTask} className="space-y-5 text-xs">
              <div>
                <label className="block text-[#A0A0A0] font-mono text-[9px] uppercase font-bold tracking-widest mb-1.5">Vazifa Nomi *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masalan, Tomat navlarini kasetalarga olish"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border-2 border-[#222222] focus:border-[#00FF00] text-white px-3 py-2.5 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] font-mono text-[9px] uppercase font-bold tracking-widest mb-1.5">Batafsil tavsif / Ish tartibi</label>
                <textarea 
                  rows={3}
                  placeholder="Xodim amal qilishi kerak bo'lgan bosqichli tartiblar..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-[#0A0A0A] border-2 border-[#222222] focus:border-[#00FF00] text-white px-3 py-2.5 outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A0A0A0] font-mono text-[9px] uppercase font-bold tracking-widest mb-1.5">Mas'ul xodim *</label>
                  <select 
                    value={assignedTo} 
                    onChange={e => setAssignedTo(Number(e.target.value))}
                    className="w-full bg-[#0A0A0A] border-2 border-[#222222] focus:border-[#00FF00] text-white px-3 py-2.5 outline-none font-sans"
                  >
                    <option value={0}>-- TANLANG --</option>
                    {users.filter(u => u.role !== 'director' && u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] font-mono text-[9px] uppercase font-bold tracking-widest mb-1.5">Muddat / Deadline *</label>
                  <input 
                    type="date" 
                    required 
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-[#0A0A0A] border-2 border-[#222222] focus:border-[#00FF00] text-white px-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#222] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowTaskModal(false)}
                  className="px-5 py-3 border border-[#333333] hover:bg-[#222222] text-white font-black uppercase text-[10px] tracking-tight transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="bg-[#00FF00] text-black hover:bg-white transition-colors duration-300 font-black uppercase text-[10px] tracking-tight px-6 py-3 cursor-pointer"
                >
                  Yuklash ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
