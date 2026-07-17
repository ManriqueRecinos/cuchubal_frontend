import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Navigation from '../components/Navigation';
import { Plus, Users } from 'lucide-react';

const Dashboard = () => {
  const [cuchubales, setCuchubales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState(20);
  const { token } = useAuth();

  const loadCuchubales = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cuchubales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCuchubales(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuchubales();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/cuchubales`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: nuevoNombre, monto_cuota: nuevoMonto })
      });
      if (res.ok) {
        setShowModal(false);
        setNuevoNombre('');
        setNuevoMonto(20);
        loadCuchubales();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bg">
      <Navigation />
      
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Mis Cuchubales</h1>
            <p className="text-text-secondary mt-1">Selecciona o crea un nuevo grupo</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" /> Nuevo Cuchubal
          </button>
        </div>

        {loading ? (
          <p className="text-text-secondary">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cuchubales.map(c => (
              <div key={c.id} className="card flex flex-col h-full hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-2 text-text">{c.nombre}</h3>
                <p className="text-text-secondary mb-6 flex items-center gap-2">
                  <Users size={16} /> {c._count.participantes} participantes
                </p>
                <div className="mt-auto flex justify-between items-center border-t border-border pt-4">
                  <span className="font-semibold text-lg">
                    ${c.monto_cuota} <small className="text-text-secondary font-normal text-sm">/ cuota</small>
                  </span>
                  <Link to={`/app/${c.id}`} className="btn btn-outline py-1.5 px-4 text-sm">Ver</Link>
                </div>
              </div>
            ))}
            {cuchubales.length === 0 && (
              <p className="text-text-secondary col-span-full">No tienes ningún cuchubal todavía.</p>
            )}
          </div>
        )}

        {/* Simple Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-bold mb-6">Crear Cuchubal</h2>
              <form onSubmit={handleCrear}>
                <div className="input-group">
                  <label>Nombre del grupo</label>
                  <input type="text" className="input" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Monto de la cuota ($)</label>
                  <input type="number" className="input" value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)} min="1" step="0.01" required />
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="button" className="btn btn-outline flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary flex-1">Crear</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
