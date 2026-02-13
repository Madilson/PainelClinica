
import React, { useState, useEffect, useRef } from 'react';
import { getRooms, saveCall, getHistory, getWaitingList, addToQueue, removeFromQueue, realTime } from '../store';
import { Room, PatientCall, WaitingPatient, PatientPriority } from '../types';

const ReceptionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'queue' | 'history'>('register');
  const [patientName, setPatientName] = useState('');
  const [priority, setPriority] = useState<PatientPriority>(PatientPriority.NORMAL);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [filterRoomId, setFilterRoomId] = useState<string | null>(null);
  
  // States para o modal de confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [patientToDeleteId, setPatientToDeleteId] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
  const [recentCalls, setRecentCalls] = useState<PatientCall[]>([]);
  
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  const refreshLocalData = () => {
    setWaitingList(getWaitingList());
    setRecentCalls(getHistory().slice(0, 10));
    setRooms(getRooms().filter(r => r.active));
  };

  useEffect(() => {
    refreshLocalData();

    const handleQueueUpdate = (newList: WaitingPatient[]) => {
      setWaitingList(newList);
    };

    realTime.on('queue_updated', handleQueueUpdate);
    
    const handleStorageChange = (e: StorageEvent) => {
      refreshLocalData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = patientName.trim();
    if (!cleanName || !selectedRoomId) return;

    const prefix = priority === PatientPriority.PREFERENTIAL ? 'P' : 'N';
    const sequence = waitingList.length + 1;
    const ticket = `${prefix}-${sequence.toString().padStart(3, '0')}`;

    const newPatient: WaitingPatient = {
      id: Date.now().toString(),
      name: cleanName.toUpperCase(),
      ticketNumber: ticket,
      priority,
      targetRoomId: selectedRoomId,
      createdAt: new Date().toISOString()
    };

    addToQueue(newPatient);
    setPatientName('');
    
    if (successAudioRef.current) {
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(() => {});
    }

    setFilterRoomId(null);
    setActiveTab('queue');
  };

  const handleCallFromQueue = (patient: WaitingPatient) => {
    const room = rooms.find(r => r.id === patient.targetRoomId);
    if (!room) return;

    const newCall: PatientCall = {
      id: Date.now().toString(),
      patientName: patient.name,
      ticketNumber: patient.ticketNumber,
      roomId: patient.targetRoomId,
      roomName: room.number,
      doctorName: room.doctorName,
      timestamp: new Date().toISOString()
    };

    saveCall(newCall);
    removeFromQueue(patient.id);
  };

  const openDeleteModal = (id: string) => {
    setPatientToDeleteId(id);
    setShowConfirmDelete(true);
  };

  const confirmDeletePatient = () => {
    if (patientToDeleteId) {
      removeFromQueue(patientToDeleteId);
      setShowConfirmDelete(false);
      setPatientToDeleteId(null);
    }
  };

  const handleDirectCall = (call: PatientCall) => {
    const recallData = { ...call, id: Date.now().toString(), timestamp: new Date().toISOString() };
    saveCall(recallData);
  };

  const handleFilterByRoom = (roomId: string) => {
    setFilterRoomId(roomId);
    setActiveTab('queue');
  };

  const filteredQueue = filterRoomId 
    ? waitingList.filter(p => p.targetRoomId === filterRoomId)
    : waitingList;

  const filteredRoom = rooms.find(r => r.id === filterRoomId);

  return (
    <div className="space-y-6">
      <audio ref={successAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" preload="auto" />

      {/* Top Stats & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border shadow-sm">
        <div className="flex gap-2">
          {[
            { id: 'register', label: 'Cadastrar', icon: 'fa-user-plus' },
            { id: 'queue', label: `Fila (${waitingList.length})`, icon: 'fa-list-ol' },
            { id: 'history', label: 'Histórico', icon: 'fa-history' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== 'queue') setFilterRoomId(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-2xl">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Status da Fila</p>
             <p className="text-sm font-bold text-slate-700">{waitingList.filter(p => p.priority === PatientPriority.PREFERENTIAL).length} Preferenciais</p>
           </div>
           <div className="w-px h-8 bg-slate-200"></div>
           <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-black">
             {waitingList.length}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-8">
          {activeTab === 'register' && (
            <div className="bg-white border rounded-[2.5rem] shadow-sm p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-800">Novo Cadastro</h2>
                <p className="text-slate-500">Preencha os dados e escolha o consultório.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="EX: JOÃO DA SILVA"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6 text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPriority(PatientPriority.NORMAL)}
                        className={`py-5 rounded-2xl border-2 font-bold transition-all ${
                          priority === PatientPriority.NORMAL 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriority(PatientPriority.PREFERENTIAL)}
                        className={`py-5 rounded-2xl border-2 font-bold transition-all ${
                          priority === PatientPriority.PREFERENTIAL 
                          ? 'border-amber-500 bg-amber-50 text-amber-700' 
                          : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <i className="fas fa-wheelchair mr-2"></i>
                        Preferencial
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Médico / Consultório</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {rooms.length === 0 ? (
                      <div className="col-span-full p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
                        Nenhum consultório ativo encontrado no sistema.
                      </div>
                    ) : (
                      rooms.map(room => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group ${
                            selectedRoomId === room.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                              selectedRoomId === room.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {room.number}
                            </span>
                            {selectedRoomId === room.id && <i className="fas fa-check-circle text-blue-500 text-xl animate-in zoom-in"></i>}
                          </div>
                          <p className="font-bold text-slate-800 truncate uppercase">{room.doctorName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{room.specialty}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!patientName.trim() || !selectedRoomId}
                  className={`w-full font-black py-6 rounded-[2rem] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-xl ${
                    !patientName.trim() || !selectedRoomId 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-hospital-blue hover:bg-blue-900 text-white shadow-blue-900/20'
                  }`}
                >
                  <i className="fas fa-user-check"></i>
                  CADASTRAR NA FILA
                </button>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    {filterRoomId ? `Fila: ${filteredRoom?.doctorName}` : 'Fila de Atendimento'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {filterRoomId ? `Visualizando apenas pacientes da Sala ${filteredRoom?.number}` : 'Clique em chamar para enviar ao painel.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {filterRoomId && (
                    <button 
                      onClick={() => setFilterRoomId(null)}
                      className="text-xs font-black text-blue-600 hover:underline"
                    >
                      LIMPAR FILTRO / VER TODOS
                    </button>
                  )}
                  <div className="px-4 py-2 bg-white border rounded-xl text-xs font-bold text-slate-500">
                    {filteredQueue.length} Aguardando
                  </div>
                </div>
              </div>

              {filteredQueue.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-couch text-3xl text-slate-300"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Nenhum paciente nesta seleção</h3>
                  <p className="text-slate-300 max-w-xs mx-auto mt-2">
                    {filterRoomId ? 'Não há pacientes aguardando para este médico específico.' : 'Fila vazia no momento.'}
                  </p>
                  {filterRoomId && (
                    <button 
                      onClick={() => setFilterRoomId(null)}
                      className="mt-6 text-blue-500 font-bold hover:underline text-sm"
                    >
                      Voltar para Fila Global
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredQueue.map((patient) => {
                    const room = rooms.find(r => r.id === patient.targetRoomId);
                    return (
                      <div key={patient.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center gap-6 group">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${
                          patient.priority === PatientPriority.PREFERENTIAL ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <span className="text-[10px] opacity-60">SENHA</span>
                          <span className="text-lg leading-none">{patient.ticketNumber}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-slate-800 uppercase truncate">{patient.name}</h4>
                            {patient.priority === PatientPriority.PREFERENTIAL && (
                              <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">PREFERENCIAL</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            <i className="fas fa-user-md mr-2 opacity-30"></i>
                            {room?.doctorName || 'Médico'} • <span className="font-bold text-blue-600">SALA {room?.number}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                           <span className="text-xs font-mono text-slate-300 hidden sm:block">{new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <button 
                             onClick={() => openDeleteModal(patient.id)}
                             className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center"
                             title="Remover paciente"
                           >
                             <i className="fas fa-trash-alt text-sm"></i>
                           </button>
                           <button 
                             onClick={() => handleCallFromQueue(patient)}
                             className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                           >
                             <i className="fas fa-bullhorn"></i>
                             CHAMAR
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-8 border-b bg-slate-50/50">
                  <h2 className="text-xl font-black text-slate-800">Histórico de Chamadas</h2>
                  <p className="text-sm text-slate-500">Pacientes chamados recentemente.</p>
               </div>
               <div className="divide-y divide-slate-100">
                  {recentCalls.length === 0 ? (
                     <p className="p-20 text-center text-slate-400 font-bold">Sem histórico disponível.</p>
                  ) : (
                    recentCalls.map(call => (
                      <div key={call.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                              {call.ticketNumber || '-'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 uppercase">{call.patientName}</p>
                              <p className="text-xs text-slate-500">Sala {call.roomName} • {call.doctorName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-mono text-slate-300">{new Date(call.timestamp).toLocaleTimeString()}</span>
                            <button 
                              onClick={() => handleDirectCall(call)}
                              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center"
                              title="Re-chamar"
                            >
                              <i className="fas fa-redo-alt text-xs"></i>
                            </button>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-hospital-blue to-blue-900 rounded-[2rem] p-8 text-white shadow-xl">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <i className="fas fa-info-circle text-blue-200"></i>
             </div>
             <h3 className="text-xl font-black mb-4">Dica de Atendimento</h3>
             <p className="text-sm opacity-80 leading-relaxed">
               Clique em um consultório abaixo para filtrar a lista e visualizar apenas os pacientes daquele médico específico.
             </p>
          </div>

          <div className="bg-white border rounded-[2rem] p-8">
             <h4 className="font-bold text-slate-800 mb-6">Fila por Consultório</h4>
             <div className="space-y-3">
                {rooms.map(room => {
                  const count = waitingList.filter(p => p.targetRoomId === room.id).length;
                  const isFiltered = filterRoomId === room.id;
                  return (
                    <button 
                      key={room.id} 
                      onClick={() => handleFilterByRoom(room.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                        isFiltered 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-slate-50 border-slate-100 hover:border-blue-300 hover:bg-white text-slate-700'
                      }`}
                    >
                       <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-xs font-black w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isFiltered ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white'
                          }`}>{room.number}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{room.doctorName}</p>
                          </div>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black shrink-0 transition-colors ${
                         isFiltered 
                         ? 'bg-white/20 text-white' 
                         : (count > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400')
                       }`}>
                          {count}
                       </span>
                    </button>
                  );
                })}
                {filterRoomId && (
                  <button 
                    onClick={() => setFilterRoomId(null)}
                    className="w-full py-3 mt-2 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Ver Fila Global
                  </button>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão (Substitui o Confirm de Sandbox) */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A3D62]/60 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200 p-10 text-center">
             <div className="w-20 h-20 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-trash-alt text-3xl"></i>
             </div>
             <h3 className="text-xl font-black text-slate-800 mb-2">Confirmar Exclusão</h3>
             <p className="text-slate-500 text-sm mb-8">Tem certeza que deseja remover este paciente da fila? Esta ação não pode ser desfeita.</p>
             <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeletePatient}
                  className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                >
                  Excluir
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;
