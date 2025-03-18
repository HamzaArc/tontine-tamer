
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  CalendarDays, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SideNavigation: React.FC = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Tontines',
      path: '/tontines',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Cycles',
      path: '/cycles',
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      name: 'Payments',
      path: '/payments',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="h-screen w-64 border-r border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
          T
        </div>
        <span className="ml-2 font-semibold text-lg">TontineTamer</span>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                isActive(item.path)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-border">
        {user && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideNavigation;
