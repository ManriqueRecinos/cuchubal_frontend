import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Navigation from '../components/Navigation';
import { UserPlus, Calendar, ArrowLeft } from 'lucide-react';

const CuchubalView = () => {
  const { id } = useParams();
  const [participantes, setParticipantes] = useState([]);
  const [cuchubal, setCuchubal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      // Obtener detalles del cuchubal (reusando endpoint de lista por practicidad o filtrando de la lista)
      const resC = await fetch(`${API_URL}/api/cuchubales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataC = await resC.json();
      const currentC = dataC.find(c => c.id === Number(id));
      if (!currentC) {
        navigate('/dashboard');
        return;
      }
      setCuchubal(currentC);

      // Obtener participantes
      const resP = await fetch(`${API_URL}/api/participantes/cuchubal/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataP = await resP.json();
      setParticipantes(dataP);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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
        loadData();
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
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;

  return (
    <div>
      <Navigation />
      
      <div className="container">
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Volver a Dashboard
        </Link>
        
        <div className="header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{cuchubal.nombre}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Cuota: <strong>${cuchubal.monto_cuota}</strong></p>
          </div>
          <Link to={`/app/${id}`} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <Calendar size={18} style={{ marginRight: '0.5rem' }} /> Ver Calendario de Pagos
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          {/* Lista de Participantes */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Participantes ({participantes.length})</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {participantes.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                      {p.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 500, textDecoration: p.activo ? 'none' : 'line-through', opacity: p.activo ? 1 : 0.5 }}>{p.nombre}</h4>
                      {!p.activo && <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>Inactivo</span>}
                    </div>
                  </div>
                  <button onClick={() => handleToggleActivo(p.id, p.activo)} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
                    {p.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
              {participantes.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay participantes en este cuchubal.</p>
              )}
            </div>
          </div>

          {/* Agregar Participante */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Agregar Participante</h3>
              <form onSubmit={handleAgregarParticipante}>
                <div className="input-group">
                  <label>Nombre del participante</label>
                  <input type="text" className="input" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required placeholder="Ej. Juan Pérez" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <UserPlus size={16} style={{ marginRight: '0.5rem' }} /> Agregar
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CuchubalView;
