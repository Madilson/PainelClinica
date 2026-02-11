
import React, { useState, useEffect } from 'react';
import { getRooms, getUsers, getHistory, setStorage } from '../store';
import { Room, User, UserRole, PatientCall } from '../types';
import { APP_CONFIG } from '../constants.tsx';

const AdminDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<PatientCall[]>([]);
  const [view, setView] = useState<'stats' | 'users' | 'rooms' | 'history'>('stats');

  useEffect(() => {
    setRooms(getRooms());
    setUsers(getUsers());
    setHistory(getHistory());
  }, []);

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
              view === tab.id ? 'bg-white shadow-sm text-hospital-blue' : 'text-slate-500 hover:text-slate-700'
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
                <button className="text-sm font-bold text-blue-500 hover:underline">Ver tudo</button>
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
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
                 + Novo Usuário
              </button>
           </div>
           <div className="p-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                  <div key={u.id} className="p-6 rounded-2xl border bg-slate-50 relative">
                     <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${u.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                           <i className="fas fa-user-circle text-2xl"></i>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between mt-4 border-t pt-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{u.role}</span>
                        <div className="flex gap-2">
                           <button className="p-2 text-slate-400 hover:text-blue-500"><i className="fas fa-edit"></i></button>
                           <button className="p-2 text-slate-400 hover:text-red-500"><i className="fas fa-trash"></i></button>
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
           <p>Esta funcionalidade está sendo implementada para a versão final.</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
