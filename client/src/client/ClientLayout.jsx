import { Outlet } from 'react-router-dom';
import ClientSidebar from './ClientSidebar';
import Navbar from '@/admin/Navbar';
import ClientDashboard from './ClientDashboard';

const ClientLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ClientSidebar />
      <Navbar />
      
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;