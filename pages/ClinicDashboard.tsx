
import React, { useState, useEffect } from 'react';
import { getRooms, getWaitingList, saveCall, removeFromQueue, realTime, getHistory } from '../store';
import { Room, WaitingPatient, PatientCall, User } from '../types';

interface ClinicDashboardProps {
  user: User;
}

const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ user }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [myQueue, setMyQueue] = useState<WaitingPatient[]>([]);
  const [myHistory, setMyHistory] = useState<PatientCall[]>([]);
  const [lastCall, setLastCall] = useState<PatientCall | null>(null);

  const loadData = () => {
    const allRooms = getRooms();
    const roomId = user.roomId || 'r1';
    const myRoom = allRooms.find(r => r.id === roomId) || allRooms[0];
    setRoom(myRoom);

    const fullQueue = getWaitingList();
    const filteredQueue = fullQueue.filter(p => p.targetRoomId === roomId);
    setMyQueue(filteredQueue);

    const fullHistory = getHistory();
    const filteredHistory = fullHistory.filter(h => h.roomId === roomId);
    setMyHistory(filteredHistory.slice(0, 10)); // Mostrar os últimos 10
    
    setLastCall(filteredHistory[0] || null);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    realTime.on('queue_updated', handleUpdate);
    realTime.on('new_call', handleUpdate);
    
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.roomId]);

  const handleCallNext = () => {
    if (myQueue.length === 0 || !room) return;

    const nextPatient = myQueue[0];
    const newCall: PatientCall = {
      id: Date.now().toString(),
      patientName: nextPatient.name,
      ticketNumber: nextPatient.ticketNumber,
      roomId: room.id,
      roomName: room.number,
      doctorName: room.doctorName,
      timestamp: new Date().toISOString()
    };

    saveCall(newCall);
    removeFromQueue(nextPatient.id);
  };

  const handleRecall = (call: PatientCall) => {
    const recall: PatientCall = {
      ...call,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    saveCall(recall);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header do Consultório */}
      <div className="bg-white border rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
            <i className="fas fa-stethoscope text-4xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase">{room?.doctorName || 'Médico'}</h2>
            <p className="text-slate-500 font-bold">
              SALA <span className="text-blue-600">{room?.number || '--'}</span> • {room?.specialty || 'Especialidade'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-slate-50 border rounded-2xl text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase">Na Fila</p>
             <p className="text-xl font-black text-slate-700">{myQueue.length}</p>
          </div>
          <div className="px-6 py-3 bg-slate-50 border rounded-2xl text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase">Atendidos</p>
             <p className="text-xl font-black text-slate-700">{myHistory.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel de Chamada Ativa */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-hospital-blue rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[350px]">
             <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <i className="fas fa-bullhorn text-[10rem] -rotate-12"></i>
             </div>
             
             <div>
                <span className="bg-white/10 border border-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Painel de Controle</span>
                <h3 className="text-4xl font-black mt-4 mb-2">Próximo Paciente</h3>
             </div>

             <div className="py-6">
                {myQueue.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Aguardando Agora:</p>
                    <h4 className="text-5xl font-black uppercase truncate">{myQueue[0].name}</h4>
                    <p className="text-xl font-bold text-white/40">Senha: {myQueue[0].ticketNumber}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-white/30 italic py-6">
                    <i className="fas fa-couch text-3xl"></i>
                    <p className="text-2xl">Não há pacientes aguardando.</p>
                  </div>
                )}
             </div>

             <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleCallNext}
                  disabled={myQueue.length === 0}
                  className={`flex-1 py-6 rounded-3xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 ${
                    myQueue.length > 0 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' 
                    : 'bg-white/10 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <i className="fas fa-play"></i>
                  CHAMAR PRÓXIMO
                </button>
                {lastCall && (
                  <button 
                    onClick={() => handleRecall(lastCall)}
                    className="px-8 py-6 bg-white/10 hover:bg-white/20 text-white rounded-3xl font-bold transition-all flex items-center justify-center gap-3 border border-white/10"
                  >
                    <i className="fas fa-redo-alt"></i>
                    RE-CHAMAR
                  </button>
                )}
             </div>
          </div>

          {/* Histórico de Atendimentos do Médico */}
          <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden">
             <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                <div>
                   <h3 className="font-black text-slate-800">Meus Atendimentos Recentes</h3>
                   <p className="text-xs text-slate-500">Histórico de pacientes que você chamou hoje.</p>
                </div>
                <i className="fas fa-history text-slate-300"></i>
             </div>
             <div className="divide-y divide-slate-100">
                {myHistory.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <p className="font-bold">Nenhum atendimento realizado ainda.</p>
                  </div>
                ) : (
                  myHistory.map((call, idx) => (
                    <div key={call.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-xs">
                             {call.ticketNumber}
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 uppercase text-sm">{call.patientName}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                Chamado às {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleRecall(call)}
                         className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center"
                         title="Chamar novamente"
                       >
                         <i className="fas fa-redo-alt text-xs"></i>
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Fila Lateral */}
        <div className="lg:col-span-4">
           <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full sticky top-24">
              <div className="p-8 border-b bg-slate-50/50">
                 <h3 className="font-black text-slate-800">Próximos da Fila</h3>
                 <p className="text-xs text-slate-500">Pacientes em espera direta.</p>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-100">
                {myQueue.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <i className="fas fa-check-circle text-4xl mb-4 text-green-200"></i>
                    <p className="font-bold">Tudo em dia!</p>
                  </div>
                ) : (
                  myQueue.map((patient, idx) => (
                    <div key={patient.id} className={`p-6 flex items-center gap-4 ${idx === 0 ? 'bg-blue-50/50' : ''}`}>
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                         patient.priority === 'PREFERENCIAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                       }`}>
                          {patient.ticketNumber}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 uppercase truncate text-sm">{patient.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Espera: {new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                       {idx === 0 && (
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                       )}
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
