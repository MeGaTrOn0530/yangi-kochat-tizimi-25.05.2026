import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Task, User } from '../types';
import { ClipboardList, Plus, Clock, CheckCircle2, X, RefreshCw, AlertTriangle, Bell, ShieldAlert, Check } from 'lucide-react';

interface TasksTabProps {
  userId: number;
  userRole: string;
}

export default function TasksTab({ userId, userRole }: TasksTabProps) {
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

  // The fixed reference date in application context is 2026-05-25
  const TODAY_STR = "2026-05-25";
  const today = new Date(TODAY_STR);

  const fetchTasksData = async () => {
    setLoading(true);
    try {
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

          {loading ? (
            <div className="text-center py-16 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-[#00FF00]" />
              YUKLANMOQDA...
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-[#111111] p-16 text-center rounded-none border-2 border-dashed border-[#222222] text-[#666] font-mono text-xs uppercase tracking-widest">
              Hozircha hech qanday topshiriqlar qo'shilmagan.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, i) => {
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
                          <div className="text-[9px] font-mono text-[#00FF00] bg-emerald-950/20 px-3 py-1.5 border border-[#00FF00]/40 uppercase tracking-widest flex items-center gap-1">
                            ✓ YAKUNLANDI (BAJARILDIG)
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
