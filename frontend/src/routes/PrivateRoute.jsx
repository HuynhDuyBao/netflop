import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function PrivateRoute({ children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;
