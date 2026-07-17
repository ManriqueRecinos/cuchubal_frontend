import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL, WS_URL } from '../config';
import Navigation from '../components/Navigation';
import HistorialUsuario from '../components/HistorialUsuario';
import { ChevronLeft, ChevronRight, DollarSign, History, UserPlus } from 'lucide-react';
import Select from 'react-select';

const Calendario = () => {
  const { id } = useParams();
  const { token } = useAuth();
  
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  
  const [participantes, setParticipantes] = useState([]);
  const [cuchubal, setCuchubal] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevoNombre, setNuevoNombre] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalData, setModalData] = useState({ participante_id: null, monto: '', tipo: 'unico', quincena: '15', nota: '' });
  const [showHistorial, setShowHistorial] = useState(null);

  const ws = useRef(null);
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const loadData = async () => {
    try {
      const resC = await fetch(`${API_URL}/api/cuchubales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataC = await resC.json();
      const currentC = dataC.find(c => c.id === Number(id));
      setCuchubal(currentC);

      const resP = await fetch(`${API_URL}/api/participantes/cuchubal/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataP = await resP.json();
      setParticipantes(dataP);

      loadPagos();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPagos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pagos/cuchubal/${id}?mes=${mesActual}&anio=${anioActual}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPagos(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();

    ws.current = new WebSocket(`${WS_URL}/?cuchubal_id=${id}`);
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NUEVO_PAGO') {
        const pago = message.payload;
        if (pago.mes === mesActual && pago.anio === anioActual) {
          setPagos(prev => [pago, ...prev]);
        }
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [id, mesActual, anioActual]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Cálculo del monto máximo a pagar basado en lo que ya abonó en el mes
  const getMaxAmount = (pId, tipo, quincena) => {
    if (!cuchubal || !pId) return 0;
    const pagosMesUsuario = pagos.filter(px => px.participante_id === pId);
    const sum15 = pagosMesUsuario.filter(px => px.quincena === '15').reduce((s, px) => s + Number(px.monto), 0);
    const sum30 = pagosMesUsuario.filter(px => px.quincena === '30').reduce((s, px) => s + Number(px.monto), 0);
    
    let max = 0;
    if (tipo === 'unico') {
      const sumQ = quincena === '15' ? sum15 : sum30;
      max = Number(cuchubal.monto_cuota) - sumQ;
    } else {
      max = (Number(cuchubal.monto_cuota) * 2) - sum15 - sum30;
    }
    return Math.max(0, max).toFixed(2);
  };

  const handleAgregarParticipante = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/participantes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: nuevoNombre, cuchubal_id: id })
      });
      if (res.ok) {
        setNuevoNombre('');
        const resP = await fetch(`${API_URL}/api/participantes/cuchubal/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataP = await resP.json();
        setParticipantes(dataP);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al agregar participante');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleActivo = async (pId, activoActual) => {
    try {
      await fetch(`${API_URL}/api/participantes/${pId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !activoActual })
      });
      const resP = await fetch(`${API_URL}/api/participantes/cuchubal/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataP = await resP.json();
      setParticipantes(dataP);
    } catch (error) {
      console.error(error);
    }
  };

  const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month - 1, 1).getDay(); 

  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(mesActual, anioActual);
    let firstDay = getFirstDayOfMonth(mesActual, anioActual);
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    
    // Forzar 42 celdas exactas (6 semanas)
    while (days.length < 42) {
      days.push(null);
    }
    
    return days;
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateObj = new Date(anioActual, mesActual - 1, day);
    setSelectedDate(dateObj);
    
    const defaultQuincena = day <= 15 ? '15' : '30';
    setModalData({ participante_id: null, monto: '', tipo: 'unico', quincena: defaultQuincena, nota: '' });
    setShowModal(true);
  };

  const handlePago = async (e) => {
    e.preventDefault();
    if (!modalData.participante_id) return alert('Selecciona un participante');

    try {
      const endpoint = modalData.tipo === 'dividido' ? '/dividido' : '/';
      const fechaPagoIso = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0).toISOString();
      
      const body = {
        participante_id: modalData.participante_id.value,
        cuchubal_id: id,
        mes: mesActual,
        anio: anioActual,
        fecha_pago: fechaPagoIso,
        monto: modalData.tipo === 'unico' ? modalData.monto : undefined,
        montoTotal: modalData.tipo === 'dividido' ? modalData.monto : undefined,
        quincena: modalData.tipo === 'unico' ? modalData.quincena : undefined,
        nota: modalData.nota
      };

      const res = await fetch(`${API_URL}/api/pagos${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setModalData(prev => ({ ...prev, monto: '', nota: '', participante_id: null }));
        setShowModal(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getMorosos = () => {
    const today = new Date();
    const isCurrentMonthAndYear = (today.getMonth() + 1 === mesActual && today.getFullYear() === anioActual);
    const isPastMonth = (anioActual < today.getFullYear() || (anioActual === today.getFullYear() && mesActual < today.getMonth() + 1));
    
    if (!cuchubal) return [];
    
    const cuota = cuchubal.monto_cuota;
    const cuotaQuincenal = Number(cuota);
    const morosos = [];

    participantes.filter(p => p.activo).forEach(p => {
      const pagos15 = pagos.filter(px => px.participante_id === p.id && px.quincena === '15').reduce((s, px) => s + Number(px.monto), 0);
      const pagos30 = pagos.filter(px => px.participante_id === p.id && px.quincena === '30').reduce((s, px) => s + Number(px.monto), 0);
      
      const debe15 = pagos15 < cuotaQuincenal;
      const debe30 = pagos30 < cuotaQuincenal;

      let esMora = false;
      let razon = '';

      if (isPastMonth) {
        if (debe15 && debe30) { esMora = true; razon = 'Ambas quincenas'; }
        else if (debe15) { esMora = true; razon = '1ra Quincena'; }
        else if (debe30) { esMora = true; razon = '2da Quincena'; }
      } else if (isCurrentMonthAndYear) {
        const diaActual = today.getDate();
        if (diaActual >= 15 && debe15) {
          esMora = true; razon = '1ra Quincena (Atrasada)';
        }
        const ultimoDia = new Date(anioActual, mesActual, 0).getDate();
        if (diaActual >= ultimoDia && debe30) {
          if (esMora) razon = 'Ambas quincenas';
          else { esMora = true; razon = '2da Quincena'; }
        }
      }

      if (esMora) {
        morosos.push({ participante: p, razon, deuda: (debe15 ? cuotaQuincenal : 0) + (debe30 ? cuotaQuincenal : 0) });
      }
    });

    return morosos;
  };

  const getPagosForDay = (day) => {
    return pagos.filter(p => {
      const fp = new Date(p.fecha_pago);
      return fp.getDate() === day && fp.getMonth() + 1 === mesActual && fp.getFullYear() === anioActual;
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-bg"><p className="text-text-secondary text-lg">Cargando...</p></div>;

  const getFechaRestriccionError = () => {
    if (!modalData.participante_id || !selectedDate) return null;
    const pId = modalData.participante_id.value;
    const misPagos = pagos.filter(px => px.participante_id === pId);
    
    if (modalData.tipo === 'unico') {
      const pagoPrevio = misPagos.find(px => px.quincena === modalData.quincena);
      if (pagoPrevio) {
        const fp = new Date(pagoPrevio.fecha_pago);
        if (fp.getDate() !== selectedDate.getDate()) {
          return `Este participante ya tiene un abono previo el día ${fp.getDate()}. Para completar su cuota, debes hacer clic en ese día del calendario.`;
        }
      }
    } else {
      const pago15 = misPagos.find(px => px.quincena === '15');
      const pago30 = misPagos.find(px => px.quincena === '30');
      if (pago15 && new Date(pago15.fecha_pago).getDate() !== selectedDate.getDate()) {
        return `Ya tiene un abono para la Q15 el día ${new Date(pago15.fecha_pago).getDate()}. Debes hacer clic en ese día.`;
      }
      if (pago30 && new Date(pago30.fecha_pago).getDate() !== selectedDate.getDate()) {
        return `Ya tiene un abono para la Q30 el día ${new Date(pago30.fecha_pago).getDate()}. Debes hacer clic en ese día.`;
      }
    }
    return null;
  };

  const morosos = getMorosos();
  const cuotaQ = cuchubal ? Number(cuchubal.monto_cuota) : 0;
  
  const selectOptions = participantes
    .filter(p => p.activo)
    .map(p => ({ value: p.id, label: p.nombre }));

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-bg lg:overflow-hidden">
      <div className="flex-none sticky top-0 z-[60]">
        <Navigation />
      </div>
      
      {/* Panel invertido: Sidebar izquierdo, Calendario derecho */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 pb-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto lg:min-h-0">
        
        {/* Panel Izquierdo (Mora y Participantes) */}
        <div className="w-full lg:w-[360px] flex-none flex flex-col gap-4 lg:h-full lg:min-h-0 h-auto">
          
          {/* Alertas de Mora */}
          <div className={`card flex flex-col p-4 lg:h-[280px] h-[200px] flex-none border-2 rounded-none ${morosos.length > 0 ? 'border-danger/30 bg-red-50/10' : 'border-border'}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 flex-none ${morosos.length > 0 ? 'text-danger' : 'text-text'}`}>
              En Mora ({morosos.length})
            </h3>
            
            {morosos.length === 0 ? (
              <p className="text-text-secondary text-sm">Nadie está en mora para este mes. ¡Excelente!</p>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                {morosos.map(m => (
                  <div key={m.participante.id} className="bg-red-50/50 p-3 rounded-none border border-danger/20">
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-sm text-text truncate pr-2">{m.participante.nombre}</strong>
                      <button onClick={() => setShowHistorial(m.participante.id)} className="text-text-secondary hover:text-text bg-white p-1 rounded-none border border-border shadow-sm">
                        <History size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-xs text-danger">{m.razon}</p>
                      <p className="text-sm font-bold text-text">${m.deuda}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gestión de Participantes */}
          <div className="card flex flex-col p-4 flex-1 lg:min-h-0 min-h-[300px] rounded-none">
            <h3 className="text-lg font-bold mb-4 flex-none text-text">Participantes ({participantes.length})</h3>
            
            {/* Formulario rápido para agregar */}
            <form onSubmit={handleAgregarParticipante} className="flex gap-2 mb-4 flex-none">
              <input 
                type="text" 
                className="input py-1.5 text-sm" 
                value={nuevoNombre} 
                onChange={e => setNuevoNombre(e.target.value)} 
                required 
                placeholder="Nuevo participante..." 
              />
              <button type="submit" className="btn btn-primary px-3">
                <UserPlus size={16} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
              {participantes.map(p => (
                 <div key={p.id} className={`flex justify-between items-center p-3 border rounded-none transition-opacity ${p.activo ? 'border-border bg-transparent' : 'border-border bg-bg opacity-60'}`}>
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-none bg-blue-50 text-primary flex items-center justify-center font-bold text-sm flex-none">
                        {p.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate pr-2">
                        <span className={`text-sm font-medium block truncate ${!p.activo ? 'line-through text-text-secondary' : 'text-text'}`}>{p.nombre}</span>
                        {!p.activo && <span className="text-[10px] text-danger uppercase tracking-wider font-semibold">Inactivo</span>}
                      </div>
                   </div>
                   <div className="flex gap-1.5 flex-none">
                     <button onClick={() => setShowHistorial(p.id)} className="btn btn-outline px-2 py-1 bg-white" title="Ver Historial">
                       <History size={14} />
                     </button>
                     <button onClick={() => handleToggleActivo(p.id, p.activo)} className="btn btn-outline px-2 py-1 bg-white" title={p.activo ? 'Desactivar' : 'Activar'}>
                       {p.activo ? '✕' : '✓'}
                     </button>
                   </div>
                 </div>
              ))}
              {participantes.length === 0 && (
                <p className="text-text-secondary text-center text-sm py-8">No hay participantes.</p>
              )}
            </div>
          </div>
        </div>

        {/* Panel Derecho (Principal): Calendario */}
        <div className="flex-1 flex flex-col lg:min-h-0 min-h-[600px] bg-surface rounded-none shadow-sm border border-border p-2 md:p-4">
          {/* Header del Calendario */}
          <div className="flex justify-between items-center mb-4 flex-none">
            <div>
              <h1 className="text-2xl font-bold text-text leading-tight">{cuchubal?.nombre}</h1>
              <p className="text-text-secondary text-sm">Cuota (Quincenal): <strong className="text-text">${cuchubal?.monto_cuota}</strong></p>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (mesActual === 1) { setMesActual(12); setAnioActual(a => a - 1); } 
                else { setMesActual(m => m - 1); }
              }} className="btn btn-outline p-2"><ChevronLeft size={20} /></button>
              
              <h2 className="text-base md:text-lg font-semibold w-24 md:w-40 text-center leading-tight">{meses[mesActual - 1]}<br className="md:hidden" /> {anioActual}</h2>
              
              <button onClick={() => {
                if (mesActual === 12) { setMesActual(1); setAnioActual(a => a + 1); } 
                else { setMesActual(m => m + 1); }
              }} className="btn btn-outline p-2"><ChevronRight size={20} /></button>
            </div>
          </div>

          {/* Grilla del Calendario flex */}
          <div className="flex-1 flex flex-col border border-border rounded-none overflow-hidden min-h-0">
            {/* Header días */}
            <div className="grid grid-cols-7 bg-bg border-b border-border text-center font-semibold text-xs md:text-sm py-2 md:py-3 text-text-secondary flex-none">
              <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
            </div>
            {/* Celdas días que crecen para rellenar el flex restante */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-border gap-px">
              {generateCalendarGrid().map((day, i) => {
                const isHoy = day && new Date().getDate() === day && new Date().getMonth() + 1 === mesActual && new Date().getFullYear() === anioActual;
                const dayPagos = day ? getPagosForDay(day) : [];

                return (
                  <div 
                    key={i} 
                    onClick={() => handleDayClick(day)}
                    className={`bg-surface p-1 md:p-2 flex flex-col overflow-hidden ${day ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''} ${isHoy ? 'bg-blue-50/30' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-center mb-1 flex-none">
                          <span className={`text-xs md:text-sm font-medium w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-none ${isHoy ? 'bg-primary/10 text-primary font-bold' : 'text-text'}`}>
                            {day}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                          {(() => {
                            const groupedDayPagos = Object.values(dayPagos.reduce((acc, p) => {
                              const key = `${p.participante_id}-${p.quincena}`;
                              if (!acc[key]) acc[key] = { ...p, monto: Number(p.monto) };
                              else acc[key].monto += Number(p.monto);
                              return acc;
                            }, {}));
                            
                            return groupedDayPagos.slice(0, 4).map(p => {
                              const pagosUserQ = pagos.filter(px => px.participante_id === p.participante_id && px.quincena === p.quincena).reduce((s, px) => s + Number(px.monto), 0);
                              const isPartial = pagosUserQ < cuotaQ;
                              let bgClass = p.quincena === '15' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-primary-hover';
                              if (isPartial) bgClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                              
                              return (
                                <div key={`${p.participante_id}-${p.quincena}`} className={`text-[9px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-none flex items-center truncate ${bgClass}`}>
                                  <strong className="mr-1 truncate">{p.participante.nombre.split(' ')[0]}</strong> ${p.monto}
                                </div>
                              );
                            });
                          })()}
                          {(() => {
                            const groupedCount = Object.keys(dayPagos.reduce((acc, p) => { acc[`${p.participante_id}-${p.quincena}`] = true; return acc; }, {})).length;
                            return groupedCount > 4 ? (
                              <div className="text-[10px] text-text-secondary text-center mt-1">
                                +{groupedCount - 4} más
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal de Pago Diario */}
        {showModal && selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-none">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text">Pagos del día: {selectedDate.toLocaleDateString()}</h2>
                <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text p-1 rounded-none">✕</button>
              </div>

              {/* Lista de pagos realizados este día (General) */}
              {getPagosForDay(selectedDate.getDate()).length > 0 && (
                <div className="mb-6 p-4 bg-bg rounded-none border border-border">
                  <h4 className="mb-3 text-sm font-semibold text-text-secondary">Ya registrados en esta fecha:</h4>
                  <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {Object.values(getPagosForDay(selectedDate.getDate()).reduce((acc, p) => {
                      const key = `${p.participante_id}-${p.quincena}`;
                      if (!acc[key]) acc[key] = { ...p, monto: Number(p.monto) };
                      else acc[key].monto += Number(p.monto);
                      return acc;
                    }, {})).map(p => (
                      <li key={`${p.participante_id}-${p.quincena}`} className="flex justify-between text-sm p-2 bg-surface rounded-none border border-border shadow-sm">
                        <span><strong className="text-text">{p.participante.nombre}</strong> <span className="text-text-secondary">({p.quincena})</span></span>
                        <strong className="text-success">+ ${p.monto}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formulario de Nuevo Pago */}
              <h3 className="text-lg font-bold mb-4">Registrar Nuevo Pago</h3>
              <form onSubmit={handlePago}>
                <div className="input-group">
                  <label>Participante (Buscar)</label>
                  <Select
                    options={selectOptions}
                    value={modalData.participante_id}
                    onChange={(selectedOption) => {
                      const maxA = selectedOption ? getMaxAmount(selectedOption.value, modalData.tipo, modalData.quincena) : '';
                      setModalData({...modalData, participante_id: selectedOption, monto: maxA, nota: ''});
                    }}
                    placeholder="Escribe para buscar..."
                    isClearable
                    required
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '0',
                        borderColor: '#e2e8f0',
                        padding: '2px',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#3b82f6' }
                      })
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>Tipo de Registro</label>
                  <select 
                    className="input" 
                    value={modalData.tipo} 
                    onChange={e => {
                      const newTipo = e.target.value;
                      const maxA = modalData.participante_id ? getMaxAmount(modalData.participante_id.value, newTipo, modalData.quincena) : '';
                      setModalData({...modalData, tipo: newTipo, monto: maxA, nota: ''});
                    }}
                  >
                    <option value="unico">Pago a una quincena</option>
                    <option value="dividido">Pago mensual completo (dividir en 15 y 30)</option>
                  </select>
                </div>

                {modalData.tipo === 'unico' && (
                  <div className="input-group">
                    <label>Quincena a la que aplica</label>
                    <select 
                      className="input" 
                      value={modalData.quincena} 
                      onChange={e => {
                        const newQ = e.target.value;
                        const maxA = modalData.participante_id ? getMaxAmount(modalData.participante_id.value, modalData.tipo, newQ) : '';
                        setModalData({...modalData, quincena: newQ, monto: maxA, nota: ''});
                      }}
                    >
                      <option value="15">Día 15</option>
                      <option value="30">Día 30 (Fin de mes)</option>
                    </select>
                  </div>
                )}
                
                {/* Mini Historial del Participante Seleccionado */}
                {modalData.participante_id && (
                  <div className="bg-blue-50/50 border border-blue-100 p-3 mb-4 text-sm text-text-secondary">
                    <p className="font-semibold text-primary mb-2">
                      Estado de pagos ({modalData.tipo === 'unico' ? `Quincena ${modalData.quincena}` : 'Mes Completo'}):
                    </p>
                    {(() => {
                      const misPagos = pagos.filter(px => px.participante_id === modalData.participante_id.value);
                      const pagosAfectados = modalData.tipo === 'unico' 
                        ? misPagos.filter(px => px.quincena === modalData.quincena)
                        : misPagos.filter(px => px.quincena === '15' || px.quincena === '30');
                      
                      if (pagosAfectados.length === 0) {
                        return <p className="italic text-xs">No hay abonos previos registrados.</p>;
                      }
                      
                      return (
                        <ul className="mb-2 space-y-1">
                          {pagosAfectados.map(px => (
                            <li key={px.id} className="flex justify-between text-xs bg-white p-1.5 border border-border">
                              <span>Abono el {new Date(px.fecha_pago).toLocaleDateString()} {px.quincena === '15' ? '(1ra Quin)' : px.quincena === '30' ? '(2da Quin)' : ''}</span>
                              <strong className="text-success">${px.monto}</strong>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                    <div className="mt-2 text-right border-t border-blue-200 pt-2">
                      <strong className="text-danger">
                        Faltante: ${getMaxAmount(modalData.participante_id.value, modalData.tipo, modalData.quincena)}
                      </strong>
                    </div>
                  </div>
                )}

                {getFechaRestriccionError() && (
                  <div className="bg-red-50 text-danger p-3 mb-4 text-sm font-semibold border border-red-200">
                    {getFechaRestriccionError()}
                  </div>
                )}

                <div className="input-group">
                  <label>Monto Recibido ($)</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={modalData.monto} 
                    onChange={e => setModalData({...modalData, monto: e.target.value})} 
                    min="0.01" 
                    max={modalData.participante_id ? getMaxAmount(modalData.participante_id.value, modalData.tipo, modalData.quincena) : ""}
                    step="0.01" 
                    required 
                  />

                  {modalData.tipo === 'dividido' && (
                    <p className="text-xs text-text-secondary mt-2">
                      Se registrarán <strong className="text-text">${modalData.monto / 2}</strong> al 15 y <strong className="text-text">${modalData.monto / 2}</strong> al 30 de forma automática.
                    </p>
                  )}
                </div>

                {modalData.participante_id && modalData.monto && Number(modalData.monto) < Number(getMaxAmount(modalData.participante_id.value, modalData.tipo, modalData.quincena)) && (
                  <div className="input-group mt-4">
                    <label>Razón / Descripción del abono parcial</label>
                    <textarea 
                      className="input py-2 text-sm" 
                      rows="2"
                      value={modalData.nota} 
                      onChange={e => setModalData({...modalData, nota: e.target.value})} 
                      placeholder="Ej: Solo depositó $10"
                      required
                    ></textarea>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-1 py-3 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      (modalData.participante_id && Number(getMaxAmount(modalData.participante_id.value, modalData.tipo, modalData.quincena)) <= 0) || 
                      !!getFechaRestriccionError()
                    }
                  >
                    <DollarSign size={18} className="mr-2" /> 
                    {modalData.participante_id && Number(getMaxAmount(modalData.participante_id.value, modalData.tipo, modalData.quincena)) <= 0 
                      ? 'Cuota ya pagada completamente' 
                      : 'Guardar Pago'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Historial */}
        {showHistorial && (
          <HistorialUsuario 
            participanteId={showHistorial} 
            onClose={() => setShowHistorial(null)} 
            cuchubalId={id}
            cuota={cuchubal?.monto_cuota}
          />
        )}
      </div>
      
      {/* Scrollbar styling for small internal scrolls */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 0px;
        }
      `}</style>
    </div>
  );
};

export default Calendario;
