import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Wallet } from 'lucide-react';

const Navigation = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-surface border-b border-border mb-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Wallet className="text-primary mr-2" size={24} />
            <span className="font-bold text-xl text-text tracking-tight">Cuchubales</span>
          </div>
          <div className="flex items-center">
            <button onClick={handleLogout} className="flex items-center text-text-secondary hover:text-danger font-medium transition-colors">
              <LogOut size={18} className="mr-1.5" /> Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
