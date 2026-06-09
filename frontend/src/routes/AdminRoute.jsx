import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function AdminRoute({ children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return ['admin', 'super_admin'].includes(user.vai_tro) ? children : <Navigate to="/" replace />;
}

export default AdminRoute;
