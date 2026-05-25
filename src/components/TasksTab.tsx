import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import { Task, User } from '../types';
import { ClipboardList, Plus, Clock, CheckCircle2, X, RefreshCw } from 'lucide-react';

interface TasksTabProps {
  userId: number;
  userRole: string;
}

export default function TasksTab({ userId, userRole }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Task form
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState<number>(0);
  const [deadline, setDeadline] = useState('');

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      // If admin/director, fetch all. Otherwise fetch assigned to current user
      const isPrivileged = userRole === 'admin' || userRole === 'director' || userRole === 'head_agronomist';
      const list = await api.getTasks(isPrivileged ? undefined : userId);
      setTasks(list);

      const uList = await api.getUsers();
      setUsers(uList);
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
      alert("Iltimos barcha majburiy maydonlarni to'ldiring.");
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

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 flex items-center gap-1.5"><ClipboardList className="text-emerald-600 h-5 w-5" /> Xodimlarga Topshiriqlar (Tasks)</h2>
          <p className="text-xs text-gray-500 font-sans">Admin tomonidan biriktirilayotgan vazifalar va ekish rejasi normativ muddati nazorati.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowTaskModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-500 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Yangi Korporativ Topshiriq
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Yuklanmoqda...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 font-mono text-xs">
          Hozirda hech qanday topshiriqlar qo'shilmagan.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const assignee = users.find(u => u.id === task.assigned_to);
            const assigner = users.find(u => u.id === task.assigned_by);
            
            let statusBadge = 'bg-amber-100 border-amber-200 text-amber-800';
            let statusUz = 'Boshlanmagan';
            if (task.status === 'in_progress') {
              statusBadge = 'bg-indigo-50 border-indigo-150 text-indigo-700';
              statusUz = 'Bajarilmoqda';
            } else if (task.status === 'done') {
              statusBadge = 'bg-emerald-50 border-emerald-150 text-emerald-800';
              statusUz = 'Bajarildi';
            }

            return (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
                    <span className="font-bold text-gray-800">{assigner ? `Admin: ${assigner.name}` : 'Tizim'}</span>
                    <span>→</span>
                    <span className="font-bold text-emerald-700">{assignee ? `Xodim: ${assignee.name} (${assignee.role.toUpperCase()})` : 'Hammasi'}</span>
                  </div>

                  <h4 className="font-bold text-sm text-gray-950">{task.title}</h4>
                  <p className="text-gray-600 leading-relaxed font-sans">{task.description}</p>
                  
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
                    <Clock className="h-3.5 w-3.5" /> Muddat: <span className="font-bold text-red-600">{task.deadline} gacha</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusBadge}`}>
                    {statusUz}
                  </span>

                  {/* assignee updates statuses or done state */}
                  {task.assigned_to === userId && (
                    <div className="flex gap-1">
                      {task.status === 'open' && (
                        <button 
                          onClick={() => updateStatus(task.id, 'in_progress')}
                          className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-150 text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-100 cursor-pointer"
                        >
                          Boshlash
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button 
                          onClick={() => updateStatus(task.id, 'done')}
                          className="text-[10px] font-mono font-bold bg-emerald-600 border border-emerald-500 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 cursor-pointer flex items-center gap-0.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Yakunlash
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- DETAILS MODAL: Create Task --- */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 max-w-md w-full p-6 shadow-2xl relative animate-in fade-in-50">
            <button 
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold font-sans text-gray-900 mb-1">Xodimlarga ish yuklash (Task Assignment)</h3>
            <p className="text-xs text-gray-500 mb-4 font-sans">Ekish rejasi, o'g'itlash tartiblari yoki katalog kiritish ishlarini xodimlarga bo'lib berish.</p>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Vazifa Nomi *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masalan, Pomidor novlarini payvandlash"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Batafsil tavsif / Ish tartibi</label>
                <textarea 
                  rows={3}
                  placeholder="Xodim amal qilishi kerak bo'lgan bosqichli tartiblar..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Kimga yuklanadi *</label>
                  <select 
                    value={assignedTo} 
                    onChange={e => setAssignedTo(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={0}>-- Xodimni tanlang --</option>
                    {users.filter(u => u.role !== 'director' && u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Muddat / Deadline *</label>
                  <input 
                    type="date" 
                    required 
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-150 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl border border-emerald-500 cursor-pointer transition-all"
                >
                  Vazifani yuklash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
