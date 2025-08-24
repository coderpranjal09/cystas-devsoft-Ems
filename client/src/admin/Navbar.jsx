import { User, ChevronDown, Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/services/auth-context.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="lg:ml-64 bg-gray-900 border-b border-gray-700 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        
        {/* Search Box */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          
          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative hover:bg-gray-800">
            <Bell className="h-5 w-5 text-gray-300" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-800 text-gray-200">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:inline text-gray-200">{user?.name || 'Admin'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-800 text-gray-200 border border-gray-700">
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-red-500 hover:bg-gray-700"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
