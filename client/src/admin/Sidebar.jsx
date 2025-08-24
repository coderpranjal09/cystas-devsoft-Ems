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
  Menu
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/services/auth-context.jsx';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/Admin/dashboard' },
    { name: 'Employees', icon: Users, path: '/Admin/employees' },
    { name: 'Assignments', icon: ClipboardList, path: '/Admin/assignments' },
    { name: 'Projects', icon: Briefcase, path: '/Admin/projects' },
    { name: 'Attendance', icon: Clock, path: '/Admin/attendance' },
    { name: 'Admins', icon: UserCog, path: '/Admin/admins' },
    { name: 'Leaves', icon: CalendarCheck, path: '/Admin/leaves' },
    { name: 'Clients', icon: User, path: '/Admin/clients' }
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
        <SheetContent side="left" className="w-[280px] p-0 bg-gray-900 text-gray-100">
          <div className="h-full py-6">
            <div className="px-4 py-2 border-b border-gray-700">
              <h1 className="text-xl font-bold">Cystas EMS</h1>
              <p className="text-sm text-gray-400">Admin Dashboard</p>
            </div>
            <nav className="mt-6 space-y-1 px-2">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={navLinkClasses}>
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="mt-8 border-t border-gray-700 pt-4 px-2">
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
          <h1 className="text-xl font-bold">Cystas EMS</h1>
          <p className="text-sm text-gray-400">Admin Dashboard</p>
        </div>
        <nav className="mt-6 flex-1 px-2 space-y-1">
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
