import { Outlet } from 'react-router-dom';
import Sidebar from './admin/Sidebar';
import Navbar from './admin/Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Navbar />
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;