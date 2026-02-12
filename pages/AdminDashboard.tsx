
import React, { useState, useEffect } from 'react';
import { getRooms, getUsers, getHistory, setUsers } from '../store';
import { Room, User, UserRole, PatientCall } from '../types';

const AdminDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsersList] = useState<User[]>([]);
  const [history, setHistory] = useState<PatientCall[]>([]);
  const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'history'>('stats');
  
  // Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.RECEPTION,
    active: true
  });

  useEffect(() => {
    setRooms(getRooms());
    setUsersList(getUsers());
    setHistory(getHistory());
  }, []);

  const refreshData = () => {
    setUsersList(getUsers());
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Password empty on edit unless changed
        role: user.role,
        active: user.active
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: UserRole.RECEPTION,
        active: true
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUsers = getUsers();
    
    if (editingUser) {
      const updated = currentUsers.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.name,
        username: formData.username,
        role: formData.role,
        active: formData.active
      } : u);
      setUsers(updated);
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        username: formData.username,
        role: formData.role,
        active: formData.active
      };
      setUsers([...currentUsers, newUser]);
    }
    
    setShowUserModal(false);
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Deseja realmente excluir este usuário?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      refreshData();
    }
  };

  const toggleUserStatus = (user: User) => {
    const updated = users.map(u => u.id === user.id ? { ...u, active: !u.active } : u);
    setUsers(updated);
    refreshData();
  };

  const stats = [
    { label: 'Total Pacientes', val: history.length, icon: 'fa-users', color: 'bg-blue-500' },
    { label: 'Consultórios Ativos', val: rooms.filter(r => r.active).length, icon: 'fa-door-open', color: 'bg-green-500' },
    { label: 'Chamados Hoje', val: history.filter(h => new Date(h.timestamp).toDateString() === new Date().toDateString()).length, icon: 'fa-calendar-check', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Sub-Nav */}
      <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'stats', label: 'Visão Geral', icon: 'fa-chart-pie' },
          { id: 'users', label: 'Gerenciar Usuários', icon: 'fa-user-cog' },
          { id: 'rooms', label: 'Gerenciar Consultórios', icon: 'fa-hospital' },
          { id: 'history', label: 'Relatório Completo', icon: 'fa-file-alt' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              view === tab.id ? 'bg-white shadow-sm text-[#0A3D62]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 ${s.color} opacity-5 -mr-8 -mt-8 rounded-full`}></div>
               <div className={`${s.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                  <i className={`fas ${s.icon} text-xl`}></i>
               </div>
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{s.label}</p>
               <h3 className="text-4xl font-black text-slate-800 mt-1">{s.val}</h3>
            </div>
          ))}
          
          <div className="md:col-span-3 bg-white border rounded-3xl shadow-sm overflow-hidden">
             <div className="p-6 border-b flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Chamadas Recentes do Dia</h4>
             </div>
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4">Consultório</th>
                      <th className="px-6 py-4">Médico</th>
                      <th className="px-6 py-4">Horário</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {history.slice(0, 8).map(call => (
                      <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-bold text-slate-700">{call.patientName}</td>
                         <td className="px-6 py-4"><span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-lg font-bold text-xs">Sala {call.roomName}</span></td>
                         <td className="px-6 py-4 text-slate-500 text-sm">{call.doctorName}</td>
                         <td className="px-6 py-4 text-slate-400 text-sm">{new Date(call.timestamp).toLocaleTimeString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {view === 'users' && (
        <div className="bg-white border rounded-3xl shadow-sm">
           <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Usuários do Sistema</h3>
                <p className="text-sm text-slate-500">Controle quem pode acessar cada módulo.</p>
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20"
              >
                 + Novo Usuário
              </button>
           </div>
           <div className="p-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                  <div key={u.id} className="p-6 rounded-2xl border bg-slate-50 relative group">
                     <div 
                       onClick={() => toggleUserStatus(u)}
                       className={`absolute top-4 right-4 w-10 h-6 rounded-full cursor-pointer transition-colors p-1 ${u.active ? 'bg-green-500' : 'bg-slate-300'}`}
                     >
                        <div className={`bg-white w-4 h-4 rounded-full transition-transform ${u.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                     
                     <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center text-white font-bold ${
                          u.role === UserRole.ADMIN ? 'bg-purple-500' : u.role === UserRole.RECEPTION ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                           {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between mt-4 border-t pt-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{u.role}</span>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => handleOpenModal(u)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all flex items-center justify-center"
                           >
                            <i className="fas fa-edit text-xs"></i>
                           </button>
                           <button 
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.username === 'admin'}
                            className={`w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center ${u.username === 'admin' ? 'opacity-20 cursor-not-allowed' : ''}`}
                           >
                            <i className="fas fa-trash text-xs"></i>
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {(view === 'rooms' || view === 'history') && (
        <div className="bg-white p-20 rounded-3xl border text-center text-slate-400">
           <i className="fas fa-tools text-4xl mb-4 opacity-20"></i>
           <h3 className="text-xl font-bold">Módulo em Desenvolvimento</h3>
           <p>Esta funcionalidade está sendo implementada.</p>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A3D62]/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: Ana Souza"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username (Login)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ex: ana.souza"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nova Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder={editingUser ? "Deixe vazio para manter" : "Senha de acesso"}
                  required={!editingUser}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perfil de Acesso</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.RECEPTION}>Recepção</option>
                  <option value={UserRole.CLINIC}>Médico/Consultório</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                 <button 
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all"
                 >
                   {editingUser ? 'Atualizar' : 'Criar Usuário'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
