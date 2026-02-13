
import React, { useState, useEffect } from 'react';
import { getRooms, getUsers, getHistory, setUsers, saveRooms } from '../store';
import { Room, User, UserRole, PatientCall } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard: React.FC = () => {
  const [rooms, setRoomsList] = useState<Room[]>([]);
  const [users, setUsersList] = useState<User[]>([]);
  const [history, setHistory] = useState<PatientCall[]>([]);
  const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'history'>('stats');
  const [searchTerm, setSearchTerm] = useState('');
  
  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.RECEPTION,
    active: true
  });

  // Room Modal State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    number: '',
    doctorName: '',
    specialty: '',
    active: true
  });

  useEffect(() => {
    setRoomsList(getRooms());
    setUsersList(getUsers());
    setHistory(getHistory());
  }, []);

  const refreshData = () => {
    setUsersList(getUsers());
    setRoomsList(getRooms());
    setHistory(getHistory());
  };

  // --- USER HANDLERS ---
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        name: user.name,
        username: user.username,
        password: '',
        role: user.role,
        active: user.active
      });
    } else {
      setEditingUser(null);
      setUserFormData({
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
        name: userFormData.name,
        username: userFormData.username,
        role: userFormData.role,
        active: userFormData.active
      } : u);
      setUsers(updated);
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: userFormData.name,
        username: userFormData.username,
        role: userFormData.role,
        active: userFormData.active
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

  // --- ROOM HANDLERS ---
  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomFormData({
        number: room.number,
        doctorName: room.doctorName,
        specialty: room.specialty,
        active: room.active
      });
    } else {
      setEditingRoom(null);
      setRoomFormData({
        number: '',
        doctorName: '',
        specialty: '',
        active: true
      });
    }
    setShowRoomModal(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const currentRooms = getRooms();
    
    if (editingRoom) {
      const updated = currentRooms.map(r => r.id === editingRoom.id ? {
        ...r,
        number: roomFormData.number,
        doctorName: roomFormData.doctorName,
        specialty: roomFormData.specialty,
        active: roomFormData.active
      } : r);
      saveRooms(updated);
    } else {
      const newRoom: Room = {
        id: 'r' + Date.now(),
        number: roomFormData.number,
        doctorName: roomFormData.doctorName,
        specialty: roomFormData.specialty,
        active: roomFormData.active
      };
      saveRooms([...currentRooms, newRoom]);
    }
    
    setShowRoomModal(false);
    refreshData();
  };

  const toggleRoomStatus = (room: Room) => {
    const updated = rooms.map(r => r.id === room.id ? { ...r, active: !r.active } : r);
    saveRooms(updated);
    refreshData();
  };

  // --- EXPORT FUNCTIONS ---
  const exportToExcel = () => {
    const data = history.map(h => ({
      'Data/Hora': new Date(h.timestamp).toLocaleString('pt-BR'),
      'Paciente': h.patientName,
      'Senha': h.ticketNumber || 'N/A',
      'Consultório': h.roomName,
      'Médico': h.doctorName
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Atendimentos");
    XLSX.writeFile(workbook, `Relatorio_MedCall_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(10, 61, 98);
    doc.text('Relatório de Atendimentos - MedCall Pro', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    const tableData = history.map(h => [
      new Date(h.timestamp).toLocaleString('pt-BR'),
      h.patientName.toUpperCase(),
      h.ticketNumber || '-',
      `SALA ${h.roomName}`,
      h.doctorName
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [['Data/Hora', 'Paciente', 'Senha', 'Local', 'Médico']],
      body: tableData,
      headStyles: { fillStyle: 'f', fillColor: [10, 61, 98], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`Relatorio_MedCall_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredHistory = history.filter(h => 
    h.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          { id: 'users', label: 'Usuários', icon: 'fa-user-cog' },
          { id: 'rooms', label: 'Consultórios', icon: 'fa-hospital' },
          { id: 'history', label: 'Relatórios', icon: 'fa-file-alt' }
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
                <h4 className="font-bold text-slate-800">Atendimentos Recentes</h4>
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
                         <td className="px-6 py-4 font-bold text-slate-700 uppercase">{call.patientName}</td>
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
                onClick={() => handleOpenUserModal()}
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
                            onClick={() => handleOpenUserModal(u)}
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

      {view === 'rooms' && (
        <div className="bg-white border rounded-3xl shadow-sm">
           <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Gerenciamento de Consultórios</h3>
                <p className="text-sm text-slate-500">Cadastre e altere os nomes das salas e médicos.</p>
              </div>
              <button 
                onClick={() => handleOpenRoomModal()}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20"
              >
                 + Novo Consultório
              </button>
           </div>
           <div className="p-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(r => (
                  <div key={r.id} className="p-6 rounded-2xl border bg-slate-50 relative group">
                     <div 
                       onClick={() => toggleRoomStatus(r)}
                       className={`absolute top-4 right-4 w-10 h-6 rounded-full cursor-pointer transition-colors p-1 ${r.active ? 'bg-green-500' : 'bg-slate-300'}`}
                     >
                        <div className={`bg-white w-4 h-4 rounded-full transition-transform ${r.active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                     </div>
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                           <span className="text-xs font-black text-slate-400 uppercase leading-none">Sala</span>
                           <span className="text-2xl font-black text-blue-600 leading-none mt-1">{r.number}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{r.doctorName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.specialty}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-end mt-4 border-t pt-4 gap-2">
                        <button 
                          onClick={() => handleOpenRoomModal(r)}
                          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2"
                        >
                          <i className="fas fa-edit"></i> Alterar Dados
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}

      {view === 'history' && (
        <div className="bg-white border rounded-3xl shadow-sm">
           <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Relatório de Atendimentos</h3>
                <p className="text-sm text-slate-500">Histórico completo de chamadas realizadas.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20">
                  <i className="fas fa-file-excel"></i> Excel
                </button>
                <button onClick={exportToPDF} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20">
                  <i className="fas fa-file-pdf"></i> PDF
                </button>
              </div>
           </div>
           <div className="p-6 bg-slate-50 border-b">
              <div className="relative max-w-md">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por paciente ou médico..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4">Senha</th>
                      <th className="px-6 py-4">Consultório</th>
                      <th className="px-6 py-4">Médico</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredHistory.length === 0 ? (
                     <tr><td colSpan={5} className="p-20 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                   ) : (
                     filteredHistory.map(call => (
                        <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 text-slate-400 text-xs font-mono">{new Date(call.timestamp).toLocaleString('pt-BR')}</td>
                           <td className="px-6 py-4 font-bold text-slate-700 uppercase">{call.patientName}</td>
                           <td className="px-6 py-4 text-blue-600 font-bold">{call.ticketNumber || '-'}</td>
                           <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold text-xs uppercase tracking-tight">Sala {call.roomName}</span></td>
                           <td className="px-6 py-4 text-slate-500 text-sm font-medium">{call.doctorName}</td>
                        </tr>
                     ))
                   )}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A3D62]/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input type="text" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none" placeholder="Ex: Ana Souza" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username (Login)</label>
                <input type="text" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none" placeholder="Ex: ana.souza" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perfil de Acesso</label>
                <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none">
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.RECEPTION}>Recepção</option>
                  <option value={UserRole.CLINIC}>Médico/Consultório</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4">
                 <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                 <button type="submit" className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A3D62]/60 backdrop-blur-sm" onClick={() => setShowRoomModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingRoom ? 'Alterar Consultório' : 'Novo Consultório'}</h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveRoom} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Número / Nome da Sala</label>
                <input type="text" value={roomFormData.number} onChange={e => setRoomFormData({...roomFormData, number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none" placeholder="Ex: 01 ou Sala VIP" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Médico Responsável</label>
                <input type="text" value={roomFormData.doctorName} onChange={e => setRoomFormData({...roomFormData, doctorName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none" placeholder="Ex: Dr. Roberto" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Especialidade</label>
                <input type="text" value={roomFormData.specialty} onChange={e => setRoomFormData({...roomFormData, specialty: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none" placeholder="Ex: Pediatria" required />
              </div>
              <div className="flex items-center gap-3 pt-4">
                 <button type="button" onClick={() => setShowRoomModal(false)} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                 <button type="submit" className="flex-1 py-4 bg-green-500 text-white font-bold rounded-2xl shadow-lg">Confirmar Alteração</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
