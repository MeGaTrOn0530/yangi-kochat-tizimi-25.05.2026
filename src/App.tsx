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
  Activity 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex font-sans text-xs text-[#E0E0E0] selection:bg-emerald-950/40">
      {/* Visual Navigation Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#222222] shrink-0 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111111] border border-[#333333] rounded-none flex items-center justify-center text-[#ffea00] hover:text-[#00FF00] transition-colors">
              <Leaf className="h-5 w-5 text-[#00FF00]" />
            </div>
            <div>
              <span className="font-black text-white font-sans tracking-tighter text-sm block leading-none uppercase">Yashil Ko'chat</span>
              <span className="text-[8px] text-[#888888] font-mono tracking-widest block mt-1">TERMINAL v1.0</span>
            </div>
          </div>

          {/* Profile user info stamp */}
          <div className="p-4 bg-[#111111] rounded-none border border-[#222222] flex items-center gap-3 hover:border-[#00FF00] transition-colors duration-200">
            <div className="w-9 h-9 rounded-none bg-[#0a0a0a] border border-[#333333] flex items-center justify-center text-[#00FF00]">
              <UserIcon className="h-4.5 w-4.5" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white block truncate uppercase tracking-tight">{currentUser.name}</span>
              <span className="text-[8px] uppercase font-mono font-bold bg-[#1A1A1A] text-[#00FF00] px-1.5 py-0.5 rounded-none leading-none inline-block mt-1">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Sidebar Menu elements depending strictly on permissions */}
          <nav className="space-y-1">
            {/* Dashboard: available for majority except Laborant */}
            {!isLab && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard & Monitoring
              </button>
            )}

            {/* Verification Chain (Approvals): Bosh Agronomy & Admin only */}
            {(isHead || isAdminRole) && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'approvals' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <ClipboardCheck className="h-4 w-4" /> Tasdiqlash Zanjiri
              </button>
            )}

            {/* Batches and Seedlings: Agronomist, Bosh Agronom, Admin viewable */}
            {(isAgr || isHead || isAdminRole) && (
              <button
                onClick={() => setActiveTab('batches')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'batches' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <Boxes className="h-4 w-4" /> Partiyalar / QR chop
              </button>
            )}

            {/* Skanerlash simulator: Agronomist, Admin, Bosh Agronom */}
            {(isAgr || isAdminRole || isHead) && (
              <button
                onClick={() => setActiveTab('scanner')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'scanner' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <QrCode className="h-4 w-4" /> Skanerlash Simulator
              </button>
            )}

            {/* Transfers: Agronomist, Admin, Bosh Agronom */}
            {(isAgr || isAdminRole || isHead) && (
              <button
                onClick={() => setActiveTab('transfers')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'transfers' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <ArrowLeftRight className="h-4 w-4" /> O'tkazishlar
              </button>
            )}

            {/* Sales logs: Agronomist, Accountant, Director, Admin */}
            {(isAgr || isAcc || isDir || isAdminRole) && (
              <button
                onClick={() => setActiveTab('sales')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'sales' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <ShoppingBag className="h-4 w-4" /> Sotuv & To'lovlar
              </button>
            )}

            {/* Catalog dictionary: Labarant, Admin, Director, Bosh Agron */}
            {(isLab || isAdminRole || isDir || isHead) && (
              <button
                onClick={() => setActiveTab('catalog')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'catalog' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <BookOpen className="h-4 w-4" /> Katalog & Navlar
              </button>
            )}

            {/* Tasks list */}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                activeTab === 'tasks' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
              }`}
            >
              <ClipboardList className="h-4 w-4" /> Topshiriqlar
            </button>

            {/* Admin specific security user CRUD */}
            {isAdminRole && (
              <button
                onClick={() => setActiveTab('admin_users')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-bold uppercase tracking-tight text-left transition-colors cursor-pointer ${
                  activeTab === 'admin_users' ? 'bg-[#00FF00] text-[#0A0A0A]' : 'text-[#888888] hover:text-white hover:bg-[#111111]'
                }`}
              >
                <Users className="h-4 w-4" /> Xodimlar
              </button>
            )}
          </nav>
        </div>

        {/* Logout bottom trigger */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none text-red-500 hover:bg-neutral-900 font-bold uppercase tracking-tight transition-colors text-left cursor-pointer border border-[#222]"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Tizimdan chiqish
        </button>
      </aside>

      {/* Main Container screen content */}
      <main className="flex-1 p-10 overflow-y-auto bg-[#0A0A0A] flex flex-col justify-start">
        {/* Unified Terminal Mainframe Header */}
        <header className="flex justify-between items-baseline border-b border-[#333333] pb-6 mb-10 shrink-0 select-none">
          <h1 className="text-4xl font-black tracking-tight leading-none m-0 uppercase text-white">
            {activeTab === 'dashboard' ? "MONITORING PANELI" : 
             activeTab === 'batches' ? "URUG' & KO'CHAT PARTIYALARI" :
             activeTab === 'scanner' ? "QR SKANERLASH TIZIMI" :
             activeTab === 'approvals' ? "TASDIQLASH ZANJIRI" :
             activeTab === 'transfers' ? "LOKATSIYALARARO O'TKAZISHLAR" :
             activeTab === 'sales' ? "SOTUVLAR VA MOLIYA" :
             activeTab === 'catalog' ? "NAV KATALOGI" :
             activeTab === 'tasks' ? "TIZIM TOPSHIRIQLARI" :
             activeTab === 'admin_users' ? "XODIMLAR BOSHQARUVI" : "TEPLITSA MONITOR"}
          </h1>
          <div className="text-right">
            <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest leading-none mb-1">Status: Faol</p>
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
    </div>
  );
}
