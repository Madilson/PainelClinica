
import React, { useState, useEffect, useRef } from 'react';
import { getRooms, saveCall, getHistory } from '../store';
import { Room, PatientCall } from '../types';

const ReceptionDashboard: React.FC = () => {
  const [patientName, setPatientName] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [recentCalls, setRecentCalls] = useState<PatientCall[]>([]);
  const [loading, setLoading] = useState(false);
  
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setRooms(getRooms().filter(r => r.active));
    setRecentCalls(getHistory().slice(0, 5));
  }, []);

  const handleCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !selectedRoomId) return;

    setLoading(true);
    const room = rooms.find(r => r.id === selectedRoomId);
    
    const newCall: PatientCall = {
      id: Date.now().toString(),
      patientName,
      ticketNumber: ticketNumber || undefined,
      roomId: selectedRoomId,
      roomName: room?.number || '?',
      doctorName: room?.doctorName || 'Desconhecido',
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      saveCall(newCall);
      setRecentCalls(prev => [newCall, ...prev].slice(0, 5));
      setPatientName('');
      setTicketNumber('');
      setLoading(false);
      
      // Som de confirmação para a recepção
      if (successAudioRef.current) {
        successAudioRef.current.currentTime = 0;
        successAudioRef.current.play().catch(() => {});
      }
    }, 500);
  };

  const recallPatient = (call: PatientCall) => {
    // Re-emite o mesmo evento com um novo timestamp para disparar as animações no painel
    const recallData = { ...call, timestamp: new Date().toISOString() };
    saveCall(recallData);
    
    // Opcional: Feedback visual na lista
    if (successAudioRef.current) {
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Som de confirmação escondido */}
      <audio ref={successAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" preload="auto" />

      {/* Call Form */}
      <div className="lg:col-span-2">
        <div className="bg-white border rounded-3xl shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <i className="fas fa-microphone-alt text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Nova Chamada</h3>
              <p className="text-sm text-slate-500">Informe os dados do paciente para anunciar no painel.</p>
            </div>
          </div>

          <form onSubmit={handleCall} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome do Paciente</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha (Opcional)</label>
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="Ex: P-045"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Consultório de Destino</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedRoomId === room.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xl text-slate-800">C-{room.number}</span>
                      {selectedRoomId === room.id && <i className="fas fa-check-circle text-blue-500"></i>}
                    </div>
                    <p className="text-xs font-bold text-slate-700 truncate">{room.doctorName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{room.specialty}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !patientName || !selectedRoomId}
              className={`w-full py-5 rounded-2xl text-white font-bold text-lg shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                loading ? 'bg-slate-300' : 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
              }`}
            >
              {loading ? (
                <i className="fas fa-spinner animate-spin"></i>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  CHAMAR PACIENTE AGORA
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-6">
        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between bg-slate-50">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-history text-slate-400"></i>
              Chamados Recentes
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCalls.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <i className="fas fa-inbox text-3xl mb-3 block opacity-20"></i>
                Nenhuma chamada recente
              </div>
            ) : (
              recentCalls.map(call => (
                <div key={call.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800 truncate uppercase">{call.patientName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Sala {call.roomName}</span>
                      <span>•</span>
                      <span className="font-mono">{new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => recallPatient(call)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Chamar novamente"
                  >
                    <i className="fas fa-redo-alt text-sm"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-hospital-blue to-blue-900 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
             <i className="fas fa-volume-up text-yellow-300"></i>
             <h5 className="font-bold">Dica de Voz</h5>
          </div>
          <p className="text-xs leading-relaxed opacity-80">
            Passe o mouse sobre um paciente recente e clique no ícone <i className="fas fa-redo-alt mx-1"></i> para repetir o anúncio no Painel TV.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
