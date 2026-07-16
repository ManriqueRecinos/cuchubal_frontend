import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const HistorialUsuario = ({ participanteId, cuchubalId, cuota, onClose }) => {
  const { token } = useAuth();
  const [pagosTotales, setPagosTotales] = useState([]);
  const [participante, setParticipante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPagos = await fetch(`${API_URL}/api/pagos/cuchubal/${cuchubalId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const allPagos = await resPagos.json();
        
        const misPagos = allPagos.filter(p => p.participante_id === participanteId);
        setPagosTotales(misPagos);
        
        if (misPagos.length > 0) {
          setParticipante(misPagos[0].participante);
        } else {
          const resP = await fetch(`${API_URL}/api/participantes/cuchubal/${cuchubalId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allP = await resP.json();
          setParticipante(allP.find(p => p.id === participanteId));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [participanteId, cuchubalId, token]);

  const renderHistorial = () => {
    const historial = {};
    pagosTotales.forEach(p => {
      const key = `${p.anio}-${p.mes}`;
      if (!historial[key]) historial[key] = { 15: 0, 30: 0 };
      if (p.quincena === '15') historial[key][15] += Number(p.monto);
      if (p.quincena === '30') historial[key][30] += Number(p.monto);
      if (p.quincena === 'mensual') {
         historial[key][15] += Number(p.monto) / 2;
         historial[key][30] += Number(p.monto) / 2;
      }
    });

    const cuotaQ = Number(cuota) / 2;
    const items = [];

    Object.keys(historial).sort((a,b) => b.localeCompare(a)).forEach(key => {
      const [anio, mes] = key.split('-');
      const p15 = historial[key][15];
      const p30 = historial[key][30];
      const nombreMes = new Date(anio, mes - 1).toLocaleString('es', { month: 'long' });

      items.push(
        <div key={key} className="py-4 border-b border-border last:border-0">
          <h4 className="capitalize mb-3 font-semibold text-text">{nombreMes} {anio}</h4>
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <div className="flex-1 p-3 bg-bg rounded-lg flex items-center justify-between border border-border">
              <span className="text-text-secondary">1ra Quincena:</span>
              {p15 >= cuotaQ ? (
                <span className="text-success flex items-center gap-1.5 font-medium"><CheckCircle size={16}/> Pagado</span>
              ) : (
                <span className={`flex items-center gap-1.5 font-medium ${p15 > 0 ? 'text-warning' : 'text-danger'}`}>
                  <AlertCircle size={16}/> {p15 > 0 ? `Q${p15}` : 'No pagado'}
                </span>
              )}
            </div>
            <div className="flex-1 p-3 bg-bg rounded-lg flex items-center justify-between border border-border">
              <span className="text-text-secondary">2da Quincena:</span>
              {p30 >= cuotaQ ? (
                <span className="text-success flex items-center gap-1.5 font-medium"><CheckCircle size={16}/> Pagado</span>
              ) : (
                <span className={`flex items-center gap-1.5 font-medium ${p30 > 0 ? 'text-warning' : 'text-danger'}`}>
                  <AlertCircle size={16}/> {p30 > 0 ? `Q${p30}` : 'No pagado'}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });

    if (items.length === 0) {
      return <p className="text-text-secondary text-center py-8">No hay registros de pago para este usuario.</p>;
    }

    return items;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-border bg-surface">
          <div>
            <h2 className="text-xl font-bold text-text">Historial de Pagos</h2>
            {participante && <p className="text-text-secondary mt-1">{participante.nombre}</p>}
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text transition-colors p-2 rounded-full hover:bg-bg">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 bg-surface">
          {loading ? (
            <p className="text-center py-8 text-text-secondary">Cargando historial...</p>
          ) : (
            <div>
              {renderHistorial()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialUsuario;
