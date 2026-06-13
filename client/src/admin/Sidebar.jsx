// src/admin/Sidebar.jsx
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Briefcase,
  CalendarCheck,
  UserCog,
  Clock,
  User,
  LogOut,
  Menu,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/services/auth-context.jsx';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Employees', icon: Users, path: '/admin/employees' },
    { name: 'Assignments', icon: ClipboardList, path: '/admin/assignments' },
    { name: 'Projects', icon: Briefcase, path: '/admin/projects' },
    { name: 'Attendance', icon: Clock, path: '/admin/attendance' },
    { name: 'Monthly Attendance', icon: CalendarCheck, path: '/admin/monthly-attendance' },
    { name: 'Performance Reports', icon: TrendingUp, path: '/admin/performance-reports' },
    { name: 'Admins', icon: UserCog, path: '/admin/admins' },
    { name: 'Leaves', icon: CalendarCheck, path: '/admin/leaves' },
    { name: 'Clients', icon: User, path: '/admin/clients' }
  ];

  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 bg-gray-900 text-white border-gray-700">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-gray-900 text-gray-100 border-r border-gray-800">
          <div className="h-full py-6">
            <div className="px-4 py-2 border-b border-gray-700">
              <h1 className="text-xl font-bold text-white">Cystas EMS</h1>
              <p className="text-sm text-gray-400">Admin Dashboard</p>
            </div>
            <nav className="mt-6 space-y-1 px-2 overflow-y-auto h-[calc(100vh-200px)]">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={navLinkClasses}>
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gray-900 text-gray-100 border-r border-gray-800">
        <div className="px-4 py-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Cystas EMS</h1>
          <p className="text-sm text-gray-400">Admin Dashboard</p>
        </div>
        <nav className="mt-6 flex-1 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClasses}>
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
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

export default Sidebar;