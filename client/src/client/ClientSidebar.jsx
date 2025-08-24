import { Home, User, ClipboardList, CalendarCheck, Folder, LogOut, Menu } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/services/auth-context.jsx';

const ClientSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/client/dashboard' },
    { name: 'Profile', icon: User, path: '/client/profile' },
    { name: 'Tasks', icon: ClipboardList, path: '/client/tasks' },
    { name: 'Projects', icon: Folder, path: '/client/projects' }, 
    { name: 'Attendance', icon: CalendarCheck, path: '/client/attendance' },
    { name: 'Leaves', icon: CalendarCheck, path: '/client/leaves' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ✅ Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed top-4 left-4 z-50 bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-[280px] p-0 bg-gray-900 text-white border-r border-gray-800"
        >
          <div className="h-full py-8">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-800">
              <h1 className="text-xl font-bold text-white">Cystas EMS</h1>
              <p className="text-sm text-gray-400">Client Portal</p>
            </div>

            {/* Navigation */}
            <nav className="mt-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-800 mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ✅ Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gray-900 text-white border-r border-gray-800">
        <div className="px-4 py-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Cystas EMS</h1>
          <p className="text-sm text-gray-400">Client Portal</p>
        </div>

        <nav className="mt-6 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default ClientSidebar;
