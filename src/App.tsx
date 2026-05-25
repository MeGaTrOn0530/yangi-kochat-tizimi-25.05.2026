/**
 * Issuer: Greenhouse Seedling Management System
 */

import { useState, useEffect, FormEvent } from 'react';
import { api } from './services/api';
import { User, Location, PlantType, Variety, GraftType, UserRole } from './types';

// Tabs
import DashboardTab from './components/DashboardTab';
import BatchesTab from './components/BatchesTab';
import ScannerTab from './components/ScannerTab';
import ApprovalsTab from './components/ApprovalsTab';
import TransfersTab from './components/TransfersTab';
import SalesTab from './components/SalesTab';
import CatalogTab from './components/CatalogTab';
import TasksTab from './components/TasksTab';
import GreenhouseTab from './components/GreenhouseTab';

import { 
  Leaf, 
  LogIn, 
  Key, 
  User as UserIcon, 
  LogOut, 
  Sliders, 
  ShieldAlert, 
  RefreshCw, 
  Users, 
  Plus, 
  X, 
  LayoutDashboard, 
  Boxes, 
  QrCode, 
  ClipboardCheck, 
  ArrowLeftRight, 
  ShoppingBag, 
  BookOpen, 
  ClipboardList, 
  Activity,
  Sun,
  Moon,
  Database,
  Bell,
  Volume2,
  VolumeX,
  Check,
  Sprout
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');

  // --- Real-time Notification System States (Visual Toasts & Audio Alert Options) ---
  interface ToastItem {
    id: string;
    title: string;
    desc: string;
    type: 'error' | 'warning' | 'info' | 'success';
    duration?: number;
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sound chime toggle (defaults to True)
  const [notifSoundEnabled, setNotifSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('notif_sound_enabled') !== 'false';
  });

  // Task Warning threshold hours (defaults to 24 hours, can be 12, 24, 48, or 72)
  const [notifThresholdHours, setNotifThresholdHours] = useState<number>(() => {
    return Number(localStorage.getItem('notif_threshold_hours') || '24');
  });

  // Additional mock notification delivery channels for Managers to select (the requested variant options)
  const [notifInAppEnabled, setNotifInAppEnabled] = useState<boolean>(() => {
    return localStorage.getItem('notif_in_app_enabled') !== 'false';
  });
  const [notifTelegramSim, setNotifTelegramSim] = useState<boolean>(() => {
    return localStorage.getItem('notif_telegram_sim') === 'true';
  });
  const [notifBrowserSim, setNotifBrowserSim] = useState<boolean>(() => {
    return localStorage.getItem('notif_browser_sim') === 'true';
  });

  // Synchronize options with LocalStorage
  useEffect(() => {
    localStorage.setItem('notif_sound_enabled', String(notifSoundEnabled));
  }, [notifSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('notif_threshold_hours', String(notifThresholdHours));
  }, [notifThresholdHours]);

  useEffect(() => {
    localStorage.setItem('notif_in_app_enabled', String(notifInAppEnabled));
  }, [notifInAppEnabled]);

  useEffect(() => {
    localStorage.setItem('notif_telegram_sim', String(notifTelegramSim));
  }, [notifTelegramSim]);

  useEffect(() => {
    localStorage.setItem('notif_browser_sim', String(notifBrowserSim));
  }, [notifBrowserSim]);

  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState<boolean>(true);
  const [greenhouseModulesEnabled, setGreenhouseModulesEnabled] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);

  // Fetch global system settings
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const res = await api.getSystemSettings();
        setGlobalNotificationsEnabled(res.notificationsEnabled);
        setGreenhouseModulesEnabled(res.greenhouseModulesEnabled);
      } catch (e) {
        console.error("Error loading system settings:", e);
      }
    };
    fetchGlobalSettings();
  }, [currentUser]);

  // Audio synthesis chime using native Web Audio API (cross-browser compatible/zero dependencies)
  const playElectronicChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5 Note
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5 Note
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn("Audio chime block:", e);
    }
  };

  // Toast trigger helper
  const triggerToast = (title: string, desc: string, type: 'error' | 'warning' | 'info' | 'success', duration = 12000) => {
    if (!notifInAppEnabled && type !== 'error') return; // error toasts bypass disable
    const id = Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { id, title, desc, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  // Perform deadline checks on user logins (real-time system check)
  const checkUserDeadlines = async (user: User) => {
    const sessionCheckKey = `checked_deadlines_sid_${user.id}`;
    // Run exactly once per session to prevent repetitive disruption on hot reloading
    if (sessionStorage.getItem(sessionCheckKey) === 'true') {
      return;
    }

    try {
      const TODAY_STR = "2026-05-25";
      const today = new Date(TODAY_STR);

      // Check global master switch set by Admin
      const settings = await api.getNotificationSettings();
      const globalEnabled = settings.notificationsEnabled;
      const isManager = user.role === 'admin' || user.role === 'director' || user.role === 'head_agronomist';

      if (!globalEnabled && !isManager) {
        console.log(`Global notifications are disabled by Administrator. Bypassing deadline scan alerts for employee: ${user.name}`);
        return;
      }
      
      // Fetch user's tasks
      const allTasks = await api.getTasks(user.role === 'admin' || user.role === 'director' || user.role === 'head_agronomist' ? undefined : user.id);
      
      // Filter tasks assigned to them which are active (not completed or archived)
      const userTasks = allTasks.filter(t => t.assigned_to === user.id && t.status !== 'done' && !t.is_archived);
      
      // Filter those with approaching remaining deadline hours <= threshold hours
      const urgentTasks = userTasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        const timeDiff = taskDate.getTime() - today.getTime();
        const hoursRemaining = timeDiff / (1000 * 3600);
        return hoursRemaining >= 0 && hoursRemaining <= notifThresholdHours;
      });

      if (urgentTasks.length > 0) {
        sessionStorage.setItem(sessionCheckKey, 'true');
        
        urgentTasks.forEach((task, index) => {
          setTimeout(() => {
            const warningMessage = `"${task.title}" topshiriq muddati tugashiga ${notifThresholdHours} soatdan kam vaqt qoldi. Yakuniy muddat: ${task.deadline}.`;
            
            // Channel 1: In-App visual Toast
            triggerToast(
              "⚠️ TOPSHIRIQ MUHLATI YaQIN!",
              warningMessage,
              'warning',
              14000
            );

            // Channel 2: Mock Telegram channel notification log
            if (notifTelegramSim) {
              console.log(`[Telegram Bot simulation API]: Broadcasted warning to user ${user.name}: ${warningMessage}`);
            }

            // Channel 3: Mock browser system notification log
            if (notifBrowserSim) {
              console.log(`[Browser Push Notification simulation API]: Triggered alert on device for ${user.name}: ${task.title}`);
            }

          }, index * 450);
        });

        // Trigger Audio Warning Chime
        if (notifSoundEnabled) {
          playElectronicChime();
        }
      }
    } catch (e) {
      console.error("Error running login deadline check:", e);
    }
  };

  // Run deadlines verification hook whenever the user logs in
  useEffect(() => {
    if (currentUser) {
      checkUserDeadlines(currentUser);
    }
  }, [currentUser, notifThresholdHours, notifSoundEnabled]);

  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Theme support & Database Status State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [dbStatus, setDbStatus] = useState<{ mode: string; connected: boolean; info: string; config: any } | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const loadDbStatus = async () => {
    try {
      const status = await api.getDbStatus();
      setDbStatus(status);
    } catch (err) {
      console.error("Failed to load db status:", err);
    }
  };

  // Global Lists
  const [locations, setLocations] = useState<Location[]>([]);
  const [plantTypes, setPlantTypes] = useState<PlantType[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [graftTypes, setGraftTypes] = useState<GraftType[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Admin users panel fields
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('agronomist');
  const [newUserLoc, setNewUserLoc] = useState<number | null>(null);

  const loadGlobalData = async () => {
    try {
      const locData = await api.getLocations();
      setLocations(locData);

      const ptData = await api.getPlantTypes();
      setPlantTypes(ptData);

      const vData = await api.getVarieties();
      setVarieties(vData);

      const gtData = await api.getGraftTypes();
      setGraftTypes(gtData);
    } catch (e) {
      console.error("Failed to load catalog datasets:", e);
    } finally {
      setGlobalLoading(false);
    }
  };

  const loadUsers = async () => {
    if (currentUser?.role === 'admin') {
      const list = await api.getUsers();
      setUsersList(list);
    }
  };

  useEffect(() => {
    loadGlobalData();
    loadDbStatus();
    // Check if session cached
    const stored = sessionStorage.getItem('seedling_user');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const resp = await api.login(authEmail.trim(), authPassword);
      setCurrentUser(resp.user);
      sessionStorage.setItem('seedling_user', JSON.stringify(resp.user));
      
      // Auto routing according to role permissions
      if (resp.user.role === 'laborant') {
        setActiveTab('catalog');
      } else if (resp.user.role === 'accountant') {
        setActiveTab('sales');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      setAuthError(err.message || "Tizimga kirishda xatolik.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('seedling_user');
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        location_id: newUserLoc ? Number(newUserLoc) : null,
        password: 'pass' // simple generic fallback
      });
      setShowUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const selectPreSeedUser = (email: string, pass: string) => {
    setAuthEmail(email);
    setAuthPassword(pass);
  };

  if (globalLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="h-10 w-10 animate-spin text-emerald-600 mb-2" />
        <span className="text-xs text-gray-500 font-mono">Ma'lumotlar bazasi yuklanmoqda...</span>
      </div>
    );
  }

  // Auth screen layout
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#111111] rounded-none border-2 border-[#333333] p-10 space-y-8 hover:border-[#00FF00] transition-colors duration-300">
          {/* Logo / Title banner */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#181818] border border-[#333333] rounded-none flex items-center justify-center text-[#ffea00] hover:text-[#00FF00] transition-colors">
              <Leaf className="h-8 w-8 text-[#00FF00]" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-sans text-white tracking-tighter uppercase leading-none">Teplitsa Tizimi</h1>
              <p className="text-xs text-[#888888] font-mono uppercase tracking-widest mt-2">RAQAMLI MONOTORING PLATFORMASI</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 text-xs">
            {authError && (
              <div className="flex items-center gap-2 p-4 bg-red-950/20 text-red-500 border border-red-900 rounded-none font-medium leading-relaxed uppercase tracking-tight">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" /> {authError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[#A0A0A0] font-mono text-[10px] uppercase font-bold tracking-widest">Elektron Pochta *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-[#555]"><UserIcon className="h-4.5 w-4.5" /></span>
                <input 
                  type="email" 
                  required
                  placeholder="admin@seedling.uz"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] border-2 border-[#333333] rounded-none pl-11 pr-4 py-3.5 text-xs text-white outline-none focus:border-[#00FF00] font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[#A0A0A0] font-mono text-[10px] uppercase font-bold tracking-widest">Tizim Paroli *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-[#555]"><Key className="h-4.5 w-4.5" /></span>
                <input 
                  type="password" 
                  required
                  placeholder="Parol kodi"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full bg-[#0A0A0A] border-2 border-[#333333] rounded-none pl-11 pr-4 py-3.5 text-xs text-white outline-none focus:border-[#00FF00] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#E0E0E0] hover:bg-[#00FF00] text-[#0A0A0A] font-black py-4 px-4 rounded-none border border-transparent transition-colors duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-tighter select-none cursor-pointer"
            >
              {authLoading ? <RefreshCw className="h-5 w-5 animate-spin text-[#0A0A0A]" /> : <><LogIn className="h-5 w-5" /> Tizimga kirish</>}
            </button>
          </form>

          {/* Quick Preseed selection list */}
          <div className="pt-4 border-t border-gray-100 space-y-2.5">
            <span className="text-gray-400 font-mono text-[9px] uppercase font-bold block">Sinov rollari shablonlari:</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
              <button 
                onClick={() => selectPreSeedUser('director@seedling.uz', 'director')}
                className="p-2 border border-gray-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 text-left transition-all flex items-center gap-1"
              >
                <Sliders className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-800">Direktor</span>
                  <span className="text-[8px] text-gray-400">Ko’rinish (Read)</span>
                </div>
              </button>
              <button 
                onClick={() => selectPreSeedUser('admin@seedling.uz', 'admin')}
                className="p-2 border border-gray-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 text-left transition-all flex items-center gap-1"
              >
                <Sliders className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-800">Admin</span>
                  <span className="text-[8px] text-gray-400">To'liq huquqli</span>
                </div>
              </button>
              <button 
                onClick={() => selectPreSeedUser('head_agronomist@seedling.uz', 'head')}
                className="p-2 border border-gray-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 text-left transition-all flex items-center gap-1"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-800">Bosh Agronom</span>
                  <span className="text-[8px] text-gray-400">Tasdiqlashlar</span>
                </div>
              </button>
              <button 
                onClick={() => selectPreSeedUser('agronomy1@seedling.uz', 'agronomist')}
                className="p-2 border border-gray-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 text-left transition-all flex items-center gap-1"
              >
                <Sliders className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-800">Agronomist</span>
                  <span className="text-[8px] text-gray-400">Skaner + Sotuv</span>
                </div>
              </button>
              <button 
                onClick={() => selectPreSeedUser('laborant@seedling.uz', 'laborant')}
                className="p-2 border border-gray-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 text-left transition-all flex items-center gap-1"
              >
                <Sliders className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-800">Laborant</span>
                  <span className="text-[8px] text-gray-400">Katalog boshqaruv</span>
                </div>
              </button>
              <button 
                onClick={() => selectPreSeedUser('accountant@seedling.uz', 'accountant')}
                className="p-2 border border-gray-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 text-left transition-all flex items-center gap-1"
              >
                <Sliders className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                <div>
                  <span className="font-bold block text-gray-800">Bugalter</span>
                  <span className="text-[8px] text-gray-400">Sotuv tasdiqlash</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Screen logic based on Tab Selection
  const isDir = currentUser.role === 'director';
  const isAdminRole = currentUser.role === 'admin';
  const isHead = currentUser.role === 'head_agronomist';
  const isAgr = currentUser.role === 'agronomist';
  const isLab = currentUser.role === 'laborant';
  const isAcc = currentUser.role === 'accountant';

  const getTabStyle = (tabId: string) => {
    const isActive = activeTab === tabId;
    if (theme === 'dark') {
      if (!isActive) return 'text-zinc-500 hover:text-white hover:bg-zinc-900/40 border-l-2 border-transparent';
      switch (tabId) {
        case 'dashboard':
          return 'bg-sky-500/10 text-sky-450 border-l-4 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)]';
        case 'greenhouse':
          return 'bg-emerald-500/10 text-[#00FF00] border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
        case 'approvals':
          return 'bg-violet-500/10 text-violet-405 border-l-4 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.15)]';
        case 'batches':
          return 'bg-teal-500/10 text-teal-455 border-l-4 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.15)]';
        case 'scanner':
          return 'bg-amber-500/10 text-amber-455 border-l-4 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
        case 'transfers':
          return 'bg-indigo-500/10 text-indigo-455 border-l-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
        case 'sales':
          return 'bg-rose-500/10 text-rose-455 border-l-4 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
        case 'catalog':
          return 'bg-fuchsia-500/10 text-fuchsia-455 border-l-4 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.15)]';
        case 'tasks':
          return 'bg-yellow-500/10 text-yellow-455 border-l-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
        case 'admin_users':
          return 'bg-red-500/10 text-red-455 border-l-4 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
        default:
          return 'bg-zinc-800 text-white border-l-4 border-zinc-650';
      }
    } else {
      if (!isActive) return 'text-slate-600 hover:text-black hover:bg-slate-100/65 border-l-2 border-transparent';
      switch (tabId) {
        case 'dashboard':
          return 'bg-sky-50 text-sky-700 border-l-4 border-sky-500 font-bold';
        case 'greenhouse':
          return 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 font-bold';
        case 'approvals':
          return 'bg-violet-50 text-violet-700 border-l-4 border-violet-500 font-bold';
        case 'batches':
          return 'bg-teal-50 text-teal-800 border-l-4 border-teal-500 font-bold';
        case 'scanner':
          return 'bg-amber-50 text-amber-80 *md:text-amber-900 border-l-4 border-amber-500 font-bold';
        case 'transfers':
          return 'bg-indigo-50 text-indigo-850 border-l-4 border-indigo-500 font-bold';
        case 'sales':
          return 'bg-rose-50 text-rose-800 border-l-4 border-rose-500 font-bold';
        case 'catalog':
          return 'bg-fuchsia-50 text-fuchsia-800 border-l-4 border-fuchsia-500 font-bold';
        case 'tasks':
          return 'bg-amber-100 text-amber-900 border-l-4 border-amber-600 font-bold';
        case 'admin_users':
          return 'bg-red-50 text-red-800 border-l-4 border-red-500 font-bold';
        default:
          return 'bg-slate-100 text-slate-800 border-l-4 border-slate-500';
      }
    }
  };

  return (
    <div className={`min-h-screen flex font-sans text-xs transition-colors duration-200 selection:bg-emerald-950/40 ${
      theme === 'dark' ? 'bg-[#0A0A0A] text-[#E0E0E0]' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Visual Navigation Sidebar */}
      <aside className={`${
        sidebarCollapsed ? 'w-0 p-0 border-r-0 overflow-hidden' : 'w-64 p-6 border-r'
      } shrink-0 flex flex-col justify-between transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 border rounded-none flex items-center justify-center transition-colors ${
                theme === 'dark' ? 'bg-[#111111] border-[#333333] text-[#00FF00]' : 'bg-emerald-50 border-emerald-100 text-[#10b981]'
              }`}>
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <span className={`font-black font-sans tracking-tighter text-sm block leading-none uppercase ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Yashil Ko'chat</span>
                <span className={`text-[8px] font-mono tracking-widest block mt-1 ${
                  theme === 'dark' ? 'text-[#888888]' : 'text-slate-500'
                }`}>TERMINAL v1.0</span>
              </div>
            </div>

            {/* Day / Night Mode Switch */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 border rounded-none transition-all duration-200 hover:scale-105 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-[#111111] border-[#333333] text-yellow-400 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-indigo-600'
              }`}
              title={theme === 'dark' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Database server status banner */}
          {dbStatus && (
            <div className={`p-3 border text-[10px] leading-tight transition-colors duration-200 ${
              dbStatus.connected 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-950/10 border-amber-500/20 text-amber-600 dark:text-amber-500'
            }`}>
              <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-[11px] mb-1">
                <Database className="h-3.5 w-3.5" />
                <span>Baza: {dbStatus.mode.toUpperCase()}</span>
                <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${dbStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <p className="text-[10px] opacity-90 leading-tight">{dbStatus.info}</p>
            </div>
          )}

          {/* Profile user info stamp */}
          <div className={`p-4 rounded-none border flex items-center gap-3 transition-colors duration-200 ${
            theme === 'dark' ? 'bg-[#111111] border-[#222222] hover:border-[#00FF00]' : 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm'
          }`}>
            <div className={`w-9 h-9 rounded-none border flex items-center justify-center ${
              theme === 'dark' ? 'bg-[#0a0a0a] border-[#333333] text-[#00FF00]' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <UserIcon className="h-4.5 w-4.5" />
            </div>
            <div className="overflow-hidden">
              <span className={`font-bold block truncate uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentUser.name}</span>
              <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-none leading-none inline-block mt-1 ${
                theme === 'dark' ? 'bg-[#1A1A1A] text-[#00FF00]' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Sidebar Menu elements depending strictly on permissions */}
          <nav className="space-y-1.5 font-sans flex-1">
            {/* Dashboard: available for majority except Laborant */}
            {!isLab && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('dashboard')}`}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard & Monitoring
              </button>
            )}

            {/* Aqlli Issiqxona Tab */}
            {(isAgr || isHead || isAdminRole || isDir) && (
              <button
                onClick={() => {
                  if (!greenhouseModulesEnabled && !isAdminRole && !isHead) {
                    triggerToast(
                      "🔒 MODUL BLOKLANGAN",
                      "Aqlli issiqxona maxsus tahlillari administrator tomonidan o'chirib qo'yilgan.",
                      "warning"
                    );
                    return;
                  }
                  setActiveTab('greenhouse');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('greenhouse')} ${(!greenhouseModulesEnabled && !isAdminRole && !isHead) ? 'opacity-40' : ''}`}
                type="button"
              >
                <span className="flex items-center gap-2.5">
                  <Sprout className="h-4 w-4" /> Aqlli Issiqxona
                </span>
                {(!greenhouseModulesEnabled && !isAdminRole && !isHead) && (
                  <span className="text-[7px] bg-amber-500/20 text-amber-500 font-mono px-1.5 py-0.5 border border-amber-500/20 rounded-sm">LOCKED</span>
                )}
              </button>
            )}

            {/* Verification Chain (Approvals): Bosh Agronomy & Admin only */}
            {(isHead || isAdminRole) && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('approvals')}`}
              >
                <ClipboardCheck className="h-4 w-4" /> Tasdiqlash Zanjiri
              </button>
            )}

            {/* Batches and Seedlings: Agronomist, Bosh Agronom, Admin viewable */}
            {(isAgr || isHead || isAdminRole) && (
              <button
                onClick={() => setActiveTab('batches')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('batches')}`}
              >
                <Boxes className="h-4 w-4" /> Partiyalar / QR chop
              </button>
            )}

            {/* Skanerlash simulator: Agronomist, Admin, Bosh Agronom */}
            {(isAgr || isAdminRole || isHead) && (
              <button
                onClick={() => setActiveTab('scanner')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('scanner')}`}
              >
                <QrCode className="h-4 w-4" /> Skanerlash Simulator
              </button>
            )}

            {/* Transfers: Agronomist, Admin, Bosh Agronom */}
            {(isAgr || isAdminRole || isHead) && (
              <button
                onClick={() => setActiveTab('transfers')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('transfers')}`}
              >
                <ArrowLeftRight className="h-4 w-4" /> O'tkazishlar
              </button>
            )}

            {/* Sales logs: Agronomist, Accountant, Director, Admin */}
            {(isAgr || isAcc || isDir || isAdminRole) && (
              <button
                onClick={() => setActiveTab('sales')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('sales')}`}
              >
                <ShoppingBag className="h-4 w-4" /> Sotuv & To'lovlar
              </button>
            )}

            {/* Catalog dictionary: Labarant, Admin, Director, Bosh Agron */}
            {(isLab || isAdminRole || isDir || isHead) && (
              <button
                onClick={() => setActiveTab('catalog')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('catalog')}`}
              >
                <BookOpen className="h-4 w-4" /> Katalog & Navlar
              </button>
            )}

            {/* Tasks list */}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('tasks')}`}
            >
              <ClipboardList className="h-4 w-4" /> Topshiriqlar
            </button>

            {/* Admin specific security user CRUD */}
            {isAdminRole && (
              <button
                onClick={() => setActiveTab('admin_users')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${getTabStyle('admin_users')}`}
              >
                <Users className="h-4 w-4" /> Xodimlar
              </button>
            )}
          </nav>
        </div>

        {/* Separated Notifications System Trigger */}
        <div className="px-3 py-2 border-t border-dashed border-zinc-200 dark:border-[#222]">
          <button
            onClick={() => {
              setShowNotifModal(true);
              playElectronicChime();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold uppercase tracking-tight text-left transition-all duration-200 cursor-pointer ${
              theme === 'dark' 
                ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-450 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.1)] hover:border-sky-500' 
                : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 shadow-[0_0_8px_rgba(14,165,233,0.06)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-500 animate-bounce" /> Xabarlar va Alerotlar
            </span>
            <span className="text-[9px] font-mono font-bold bg-sky-500/20 text-sky-500 px-1.5 py-0.5 rounded">Tizimli</span>
          </button>
        </div>

        {/* Logout bottom trigger */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none text-red-500 font-bold uppercase tracking-tight transition-colors text-left cursor-pointer border ${
            theme === 'dark' ? 'hover:bg-neutral-900 border-[#222]' : 'hover:bg-red-50 border-red-200 bg-red-50/20'
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" /> Tizimdan chiqish
        </button>
      </aside>

      {/* Main Container screen content */}
      <main className={`flex-1 p-10 overflow-y-auto flex flex-col justify-start transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-slate-100'
      }`}>
         {/* Unified Terminal Mainframe Header */}
        <header className={`flex justify-between items-baseline border-b pb-6 mb-10 shrink-0 select-none ${
          theme === 'dark' ? 'border-[#333333]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {/* COLLAPSIBLE TOGGLE HAMBURGER BUTTON */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 border transition-all rounded-md cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-[#111] border-[#333] text-gray-400 hover:text-white hover:border-[#00FF00]' 
                  : 'bg-white border-slate-250 text-slate-600 hover:text-black hover:bg-slate-50'
              }`}
              title={sidebarCollapsed ? "Asosiy panelni ko'rsatish" : "Asosiy panelni yashirish"}
              type="button"
            >
              <Sliders className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowNotifModal(true);
                playElectronicChime();
              }}
              className={`p-2 border transition-all rounded-md cursor-pointer flex items-center gap-1.5 ${
                theme === 'dark' 
                  ? 'bg-sky-502 bg-[#111] border-[#333] text-sky-450 hover:text-sky-300 hover:border-sky-500' 
                  : 'bg-white border-slate-250 text-sky-700 hover:text-sky-850 hover:bg-sky-50'
              }`}
              title="Xabarnomalar sozlamalari"
              type="button"
            >
              <Bell className="h-4 w-4 text-sky-500 animate-pulse animate-bounce" />
              <span className="text-[10px] uppercase font-bold font-mono no-print">XABARNOMALAR</span>
            </button>
            <h1 className={`text-4xl font-black tracking-tight leading-none m-0 uppercase ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {activeTab === 'dashboard' ? "MONITORING PANELI" : 
               activeTab === 'greenhouse' ? "🌱 AQLLI ISSIQXONA" :
               activeTab === 'batches' ? "URUG' & KO'CHAT PARTIYALARI" :
               activeTab === 'scanner' ? "QR SKANERLASH TIZIMI" :
               activeTab === 'approvals' ? "TASDIQLASH ZANJIRI" :
               activeTab === 'transfers' ? "LOKATSIYALARARO O'TKAZISHLAR" :
               activeTab === 'sales' ? "SOTUVLAR VA MOLIYA" :
               activeTab === 'catalog' ? "NAV KATALOGI" :
               activeTab === 'tasks' ? "TIZIM TOPSHIRIQLARI" :
               activeTab === 'admin_users' ? "XODIMLAR BOSHQARUVI" : "TEPLITSA MONITOR"}
            </h1>
          </div>
          <div className="text-right">
            <p className={`text-[10px] font-mono uppercase tracking-widest leading-none mb-1 ${
              theme === 'dark' ? 'text-[#555]' : 'text-slate-400'
            }`}>Status: Faol</p>
            <p className="text-sm font-bold font-mono tracking-wider text-[#00FF00]">ONLINE</p>
          </div>
        </header>
        {/* TAB 1: Dashboard report */}
        {activeTab === 'dashboard' && !isLab && (
          <DashboardTab 
            locations={locations} 
            plantTypes={plantTypes} 
            varieties={varieties} 
            userRole={currentUser.role}
          />
        )}

        {/* TAB EXTRA: Aqlli Issiqxona Kengaytirilgan Modullari */}
        {activeTab === 'greenhouse' && (isAgr || isHead || isAdminRole || isDir) && (
          <GreenhouseTab 
            locations={locations} 
            userRole={currentUser.role}
            theme={theme}
          />
        )}

        {/* TAB 2: Batch log */}
        {activeTab === 'batches' && (isAgr || isHead || isAdminRole) && (
          <BatchesTab 
            locations={locations} 
            plantTypes={plantTypes} 
            varieties={varieties} 
            graftTypes={graftTypes} 
            userId={currentUser.id}
          />
        )}

        {/* TAB 3: Scanner controller */}
        {activeTab === 'scanner' && (isAgr || isAdminRole || isHead) && (
          <ScannerTab 
            locations={locations} 
            plantTypes={plantTypes} 
            varieties={varieties} 
            userId={currentUser.id} 
            userRole={currentUser.role}
          />
        )}

        {/* TAB 4: Approvals verifying */}
        {activeTab === 'approvals' && (isHead || isAdminRole) && (
          <ApprovalsTab 
            locations={locations} 
            plantTypes={plantTypes} 
            varieties={varieties} 
            userId={currentUser.id}
          />
        )}

        {/* TAB 5: Transfers */}
        {activeTab === 'transfers' && (isAgr || isAdminRole || isHead) && (
          <TransfersTab 
            locations={locations} 
            plantTypes={plantTypes} 
            varieties={varieties} 
            userId={currentUser.id} 
            userRole={currentUser.role}
          />
        )}

        {/* TAB 6: Sales lists */}
        {activeTab === 'sales' && (isAgr || isAcc || isDir || isAdminRole) && (
          <SalesTab 
            locations={locations} 
            plantTypes={plantTypes} 
            varieties={varieties} 
            userId={currentUser.id} 
            userRole={currentUser.role}
          />
        )}

        {/* TAB 7: Catalog list */}
        {activeTab === 'catalog' && (isLab || isAdminRole || isDir || isHead) && (
          <CatalogTab 
            plantTypes={plantTypes} 
            varieties={varieties} 
            graftTypes={graftTypes} 
            userId={currentUser.id} 
            userRole={currentUser.role}
            onRefresh={loadGlobalData}
          />
        )}

        {/* TAB 8: Assign tasks */}
        {activeTab === 'tasks' && (
          <TasksTab 
            userId={currentUser.id} 
            userRole={currentUser.role}
          />
        )}

        {/* TAB 9: Admin panel users creator */}
        {activeTab === 'admin_users' && isAdminRole && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 border-none font-sans">Tizim foydalanuvchilari (Xodimlar)</h2>
                <p className="text-xs text-gray-500">Xavfsizlik nuqtai nazaridan yangi xodimlar ro'yxatga kiritilib, tegishli rollar va ob'ektlar biriktiriladi.</p>
              </div>
              <button 
                onClick={() => setShowUserModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-500"
              >
                <Plus className="h-4 w-4" /> Yangi Xodim Qo'shish
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 font-mono text-[10px] uppercase text-gray-400 font-bold tracking-wider">
                    <th className="py-3 px-4">Ism Familiya</th>
                    <th className="py-3 px-4">Aloqa (Email)</th>
                    <th className="py-3 px-4">Sohasi (Roli)</th>
                    <th className="py-3 px-4">Biriktirilgan Ob'ekt</th>
                    <th className="py-3 px-4">Holati</th>
                    <th className="py-3 px-4 text-center">Tahrirlash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px] font-sans">
                  {usersList.map(u => {
                    const matchedLoc = locations.find(l => l.id === u.location_id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/20">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{u.name}</td>
                        <td className="py-3.5 px-4 font-mono text-gray-400">{u.email}</td>
                        <td className="py-3.5 px-4 uppercase font-mono text-[10px] font-bold text-gray-700">{u.role.replace('_', ' ')}</td>
                        <td className="py-3.5 px-4 text-gray-500 font-sans">{matchedLoc ? matchedLoc.name : 'Farqlanmagan (Markaziy)'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded-full border ${
                            u.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-150'
                          }`}>
                            {u.is_active ? 'Faol xodim' : 'Bloklangan'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={() => handleToggleUserActive(u)}
                            className={`p-1 px-2 text-[9px] font-bold font-mono rounded cursor-pointer transition-all ${
                              u.is_active ? 'bg-red-50 text-red-650 border border-red-150' : 'bg-emerald-50 text-emerald-850 border border-emerald-150'
                            }`}
                          >
                            {u.is_active ? 'Bloklash' : 'Aktivlashtir'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* --- MODAL: Create system operator User --- */}
            {showUserModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl border border-gray-150 max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in-50">
                  <button 
                    onClick={() => setShowUserModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="text-base font-bold text-gray-900 font-sans mb-1">Xodim qo'shish</h3>
                  <p className="text-xs text-gray-450 mb-4">Yangilangan xodimlarga avtomatik kirish 'pass' paroli beriladi.</p>

                  <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Xodim Ismi *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Dilshod Nemataliyev"
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Elektron pochta (Email) *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="xodim@seedling.uz"
                        value={newUserEmail}
                        onChange={e => setNewUserEmail(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Sohasi (Roli) *</label>
                        <select 
                          value={newUserRole} 
                          onChange={e => setNewUserRole(e.target.value as UserRole)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="agronomist">Agronomist</option>
                          <option value="head_agronomist">Head Agronomist</option>
                          <option value="laborant">Laborant</option>
                          <option value="accountant">Accountant</option>
                          <option value="director">Director</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-500 font-mono text-[9px] uppercase font-bold mb-1">Teplitsa birikmasi</label>
                        <select 
                          value={newUserLoc || 0} 
                          onChange={e => setNewUserLoc(e.target.value ? Number(e.target.value) : null)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value={0}>Zaruriyatsiz</option>
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-150 flex justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowUserModal(false)}
                        className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer"
                      >
                        Bekor qilish
                      </button>
                      <button 
                        type="submit" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer border border-emerald-500"
                      >
                        Yaratish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* BRAND NEW: Separate Premium Notifications and Alerts Control Center Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in animate-in fade-in zoom-in-95">
          <div className={`rounded-2xl border w-full max-w-xl shadow-2xl overflow-hidden transition-all ${
            theme === 'dark' 
              ? 'bg-[#121212] border-zinc-805 text-white' 
              : 'bg-white border-slate-205 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className={`p-5 flex items-center justify-between border-b ${
              theme === 'dark' ? 'bg-[#191919] border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-sky-500 animate-bounce" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight font-sans">Ogohlantirish va Xabarlar tizimi</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Tizimli master datchiklar va Telegram sozlamalari</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotifModal(false)}
                className={`p-1.5 border hover:scale-105 rounded-lg transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-[#333] hover:bg-zinc-800 text-zinc-450' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* SECTION 1: MASTER CONTROLLER (Admin & Director Roles Only) */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'director' || currentUser?.role === 'head_agronomist') ? (
                <div className={`p-4 rounded-xl border space-y-4 ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="block text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">🔒 MASTER BOSHQARUV TUGMALARI (ADMINISTRATOR)</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Switch 1: Global warnings */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold">
                        <span>Tizim ogohlantirishlari:</span>
                        <span className={globalNotificationsEnabled ? 'text-emerald-500' : 'text-red-500'}>
                          {globalNotificationsEnabled ? 'FAOL' : 'YOPUQ'}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const nextVal = !globalNotificationsEnabled;
                            const up = await api.updateSystemSettings({ notificationsEnabled: nextVal });
                            setGlobalNotificationsEnabled(up.notificationsEnabled);
                            triggerToast(
                              up.notificationsEnabled ? "TIZIM FAOL DEB BELGILANDI" : "TIZIM VAQTINChA YOPILDI",
                              up.notificationsEnabled 
                                ? "Barcha xodimlar va laborantlar uchun yaqinlashib kelayotgan topshiriqlar ogohlantirishi yoqildi."
                                : "Barcha xodimlar uchun topshiriq ogohlantirishlari global ravishda o'chirildi.",
                              up.notificationsEnabled ? 'success' : 'error',
                              7000
                            );
                            if (notifSoundEnabled) playElectronicChime();
                          } catch (e) {
                            triggerToast("Xatolik", "Tizim sozlamasini o'zgartirishda xatolik yuz berdi.", "error");
                          }
                        }}
                        className={`w-full py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-center border cursor-pointer transition-all duration-150 rounded-lg ${
                          globalNotificationsEnabled
                            ? 'bg-rose-950/20 hover:bg-rose-900/30 text-rose-500 border-rose-500/30'
                            : 'bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-500 border-emerald-500/30'
                        }`}
                        type="button"
                      >
                        {globalNotificationsEnabled ? "🔴 GLOBAL ALERTLARNI O'CHIRISH" : "🟢 GLOBAL ALERTLARNI YOQISH"}
                      </button>
                    </div>

                    {/* Switch 2: Advanced Greenhouse modules */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold">
                        <span>Aqlli modullar ruxsati:</span>
                        <span className={greenhouseModulesEnabled ? 'text-emerald-500' : 'text-amber-500'}>
                          {greenhouseModulesEnabled ? 'OCHIQ' : 'BLOKLANGAN'}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const nextVal = !greenhouseModulesEnabled;
                            const up = await api.updateSystemSettings({ greenhouseModulesEnabled: nextVal });
                            setGreenhouseModulesEnabled(up.greenhouseModulesEnabled);
                            triggerToast(
                              up.greenhouseModulesEnabled ? "AQLLI MODULLAR YOQILDI" : "AQLLI MODULLAR CHEKLANDI",
                              up.greenhouseModulesEnabled 
                                ? "Barcha agronomlar uchun sug'orish, urug' unuvchanligi kalkulyatori hamda interaktiv 2D xaritalari faollashdi."
                                : "Aqlli issiqxona modullari va maxsus jurnallar boshqa xodimlarda bloklandi.",
                              up.greenhouseModulesEnabled ? 'success' : 'warning',
                              7000
                            );
                            if (notifSoundEnabled) playElectronicChime();
                          } catch (e) {
                            triggerToast("Xatolik", "Aqlli modullarni yangilashda xatolik yuz berdi.", "error");
                          }
                        }}
                        className={`w-full py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-center border cursor-pointer transition-all duration-150 rounded-lg ${
                          greenhouseModulesEnabled
                            ? 'bg-amber-950/20 hover:bg-amber-900/10 text-amber-500 border-amber-500/30'
                            : 'bg-sky-950/20 hover:bg-sky-900/30 text-sky-400 border-sky-500/30'
                        }`}
                        type="button"
                      >
                        {greenhouseModulesEnabled ? "🔒 MODULLARNI BLOKLASH" : "🔓 MODULLARGA RUXSAT BERISH"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border text-[11px] font-mono space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <span className="block font-bold text-[9px] text-zinc-500">🔒 ADMIN RUXSATNOMASI STATUSI:</span>
                  <div className="flex items-center justify-between">
                    <span>GLOBAL ALERTLAR:</span>
                    <span className={`font-black uppercase ${globalNotificationsEnabled ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {globalNotificationsEnabled ? 'RUXSAT ETILGAN' : 'ADMIN TOMONIDAN YOPILGAN'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AQLLI ISSIQXONA INTERACTIV MODULLARI:</span>
                    <span className={`font-black uppercase ${greenhouseModulesEnabled ? 'text-emerald-500' : 'text-amber-550'}`}>
                      {greenhouseModulesEnabled ? 'FAOL / OCHIQ' : 'CHIKLANGAN'}
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION 2: CANALS AND SETTINGS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <span className="block text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">📡 OGOHLANTIRISH KANALLARI STATUSI</span>
                  
                  {/* Channel Toggles */}
                  <div className={`p-3.5 rounded-xl border space-y-3 ${
                    theme === 'dark' ? 'bg-[#151515] border-zinc-800' : 'bg-slate-50/50 border-slate-150'
                  }`}>
                    {/* Audio Enable sound */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 uppercase">
                      <span className="flex items-center gap-1.5 text-zinc-400"><Volume2 className="h-4 w-4 text-sky-500 animate-pulse" /> Audio Chime:</span>
                      <button 
                        onClick={() => {
                          setNotifSoundEnabled(!notifSoundEnabled);
                          playElectronicChime();
                        }}
                        className={`px-2 py-1 font-bold cursor-pointer text-[9px] rounded-lg border transition-all ${
                          notifSoundEnabled 
                            ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' 
                            : 'text-zinc-500 border-zinc-700/50 hover:text-white hover:bg-zinc-800'
                        }`}
                        type="button"
                      >
                        {notifSoundEnabled ? "YOQILGAN" : "O'CHIRILGAN"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 uppercase">
                      <span>1. In-App Toast:</span>
                      <button 
                        onClick={() => {
                          setNotifInAppEnabled(!notifInAppEnabled);
                          triggerToast("BOSHQA VARIANT: SOZLAMALAR YAXSHILANDI", "Visual toast xabarnomalar tizimi yangilandi.", "info", 5000);
                        }}
                        className={`px-2 py-1 font-bold cursor-pointer text-[9px] rounded-lg border transition-all ${
                          notifInAppEnabled 
                            ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' 
                            : 'text-zinc-500 border-zinc-700/50 hover:text-white hover:bg-zinc-800'
                        }`}
                        type="button"
                      >
                        {notifInAppEnabled ? "FAOL" : "O'CHIRILGAN"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 uppercase">
                      <span>2. Telegram Bot:</span>
                      <button 
                        onClick={() => {
                          setNotifTelegramSim(!notifTelegramSim);
                          triggerToast("Telegram kanali sozlandi", "Telegram bot simulyatsiyasi o'zgartirildi.", "info", 5000);
                        }}
                        className={`px-2 py-1 font-bold cursor-pointer text-[9px] rounded-lg border transition-all ${
                          notifTelegramSim 
                            ? 'text-sky-400 border-sky-500/20 bg-sky-500/10' 
                            : 'text-zinc-500 border-zinc-700/50 hover:text-white hover:bg-zinc-800'
                        }`}
                        type="button"
                      >
                        {notifTelegramSim ? "SIMULYATSIYa" : "YOPUQ"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 uppercase">
                      <span>3. Browser System Push:</span>
                      <button 
                        onClick={() => {
                          setNotifBrowserSim(!notifBrowserSim);
                          triggerToast("Tizim Push simulyatori", "Browser orqali simulyatsiya sozlamalari yangilandi.", "info", 5000);
                        }}
                        className={`px-2 py-1 font-bold cursor-pointer text-[9px] rounded-lg border transition-all ${
                          notifBrowserSim 
                            ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' 
                            : 'text-zinc-500 border-zinc-700/50 hover:text-white hover:bg-zinc-800'
                        }`}
                        type="button"
                      >
                        {notifBrowserSim ? "SIMULYATSIYa" : "YOPUQ"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="block text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">⏳ MUHLAT VA OGOHLANTIRISH CHEGARASI</span>
                  
                  <div className={`p-4 rounded-xl border space-y-4 ${
                    theme === 'dark' ? 'bg-[#151515] border-zinc-800' : 'bg-slate-50/50 border-slate-150'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 font-bold uppercase font-mono">Muhlat oralig'i:</span>
                      <select
                        value={notifThresholdHours}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNotifThresholdHours(val);
                          triggerToast("Oraliq yangilandi", `Task ogohlantirish muddati ${val} soatga sozladi.`, "info", 6000);
                        }}
                        className={`text-xs py-1 px-2 border rounded-lg font-mono text-center w-28 ${
                          theme === 'dark' 
                            ? 'bg-black border-zinc-800 text-zinc-200' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value={12}>12 soat</option>
                        <option value={24}>24 soat</option>
                        <option value={48}>48 soat</option>
                        <option value={72}>72 soat</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-zinc-400 tracking-tight leading-relaxed font-sans">
                      Topshiriqlarning belgilangan ijro muddati mana shu vaqt oralig'idan kam qolganda, tizim mas'ullarga telegram va in-app visual ogohlantirishlar jo'natishni boshlaydi.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SIMULATOR LIVE TESTS */}
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">🎭 TIZIMI INTEGRATSIYASI IMTAKUNI (SANDBOX TESTS)</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      triggerToast(
                        "⏳ MUHLAT YaQIN (OGOHLANTIRISH)",
                        `"Datchik darchasini dezinfeksiyalash" topshirig'ingiz muddati yakunlanishiga kamida ${notifThresholdHours} soat qoldi.`,
                        'warning'
                      );
                      if (notifSoundEnabled) playElectronicChime();
                    }}
                    className={`p-3.5 text-xs font-mono font-bold uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 border hover:scale-[1.02] cursor-pointer rounded-xl ${
                      theme === 'dark'
                        ? 'bg-amber-950/20 text-amber-400 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                    type="button"
                  >
                    ⚡ Test sarg'ish signal
                  </button>

                  <button
                    onClick={() => {
                      triggerToast(
                        "🎉 VAZIFA MUvAFFAQIYATLI YAKUNLANDI",
                        "O'tkazilgan tahlillar natijasida barcha datchiklar muvaffaqiyatli topshirildi va hisobot tasdiqlandi.",
                        'success'
                      );
                      try {
                        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                        const ctx = new AudioCtx();
                        const now = ctx.currentTime;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(523.25, now); // C5
                        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                        osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
                        gain.gain.setValueAtTime(0, now);
                        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now);
                        osc.stop(now + 0.5);
                      } catch(e) {}
                    }}
                    className={`p-3.5 text-xs font-mono font-bold uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 border hover:scale-[1.02] cursor-pointer rounded-xl ${
                      theme === 'dark'
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30'
                        : 'bg-emerald-50 text-emerald-850 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    type="button"
                  >
                    🚀 Test yashil signal
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-end gap-3 ${
              theme === 'dark' ? 'bg-[#191919] border-zinc-800' : 'bg-slate-50 border-slate-150'
            }`}>
              <button
                onClick={() => {
                  setShowNotifModal(false);
                  triggerToast("Saqlandi", "Sozlamalar kuchga kirdi.", "success", 3000);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-emerald-500/20"
                type="button"
              >
                Tasdiqlash & Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Floating Toast Notification Overlay Wrapper (renders in-app toast alerts) */}
      <div id="toast-overlay-wrapper" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full select-none pointer-events-none">
        {toasts.map((toast) => {
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 border shadow-2xl animate-slide-in relative overflow-hidden transition-all duration-300 flex items-start gap-4 rounded-xl ${
                theme === 'dark'
                  ? isWarning ? 'bg-[#181308] border-amber-500/50 text-amber-300' :
                    isError ? 'bg-[#1a0c0c] border-red-500/50 text-red-300' :
                    isSuccess ? 'bg-[#0a170f] border-[#00FF00]/50 text-emerald-300' :
                    'bg-[#08121a] border-sky-500/50 text-sky-300'
                  : isWarning ? 'bg-amber-50/95 border-amber-300 text-amber-900 shadow-amber-100/40 backdrop-blur-md' :
                    isError ? 'bg-red-50/95 border-red-300 text-red-900 shadow-red-100/40 backdrop-blur-md' :
                    isSuccess ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-100/40 backdrop-blur-md' :
                    'bg-sky-50/95 border-sky-300 text-sky-900 shadow-sky-100/40 backdrop-blur-md'
              }`}
            >
              {/* Highlight bar indicators */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                isWarning ? 'bg-amber-500 animate-pulse' :
                isError ? 'bg-red-500' :
                isSuccess ? 'bg-[#00FF00]' :
                'bg-sky-500'
              }`}></div>

              {/* Toast Icon */}
              <div className="shrink-0 mt-0.5">
                {isWarning && <Bell className="h-4.5 w-4.5 text-amber-500 animate-bounce" />}
                {isError && <ShieldAlert className="h-4.5 w-4.5 text-red-500" />}
                {isSuccess && <Check className="h-4.5 w-4.5 text-emerald-500 dark:text-[#00FF00]" />}
                {isInfo && <Activity className="h-4.5 w-4.5 text-sky-500" />}
              </div>

              {/* Toast content text */}
              <div className="flex-grow min-w-0">
                <h4 className="font-mono font-black uppercase tracking-wider text-[10.5px] mb-1">
                  {toast.title}
                </h4>
                <p className="text-[10.5px] font-sans leading-relaxed opacity-95">
                  {toast.desc}
                </p>
              </div>

              {/* Manual Dismiss */}
              <button
                onClick={() => {
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
                className={`p-0.5 hover:scale-110 transition-transform cursor-pointer opacity-60 hover:opacity-100 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-705'
                }`}
                type="button"
                title="Xabarnomani yopish"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
