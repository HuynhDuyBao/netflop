import { Outlet } from 'react-router-dom';
import AdminHeader from '../admin/components/AdminHeader.jsx';
import AdminSidebar from '../admin/components/AdminSidebar.jsx';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
