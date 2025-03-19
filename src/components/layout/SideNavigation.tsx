
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, PieChart, CalendarDays, CreditCard, Users, Settings, LogOut, UserCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

const SideNavigation: React.FC = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(!isMobile);
  
  React.useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };
  
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Tontines',
      href: '/tontines',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Cycles',
      href: '/cycles',
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: <UserCircle className="h-5 w-5" />,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  if (!isSidebarOpen && isMobile) return null;
  
  return (
    <div className={cn(
      "h-screen flex-shrink-0 border-r bg-background",
      isMobile ? "fixed z-50 w-64" : "w-64"
    )}>
      <ScrollArea className="h-full py-6">
        <div className="flex flex-col h-full px-3 py-2">
          <div className="mb-10 px-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="font-bold text-xl">
                Tontine<span className="text-primary">Tamer</span>
              </div>
            </Link>
          </div>
          
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={isActivePath(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActivePath(item.href) ? "bg-secondary" : ""
                )}
                asChild
              >
                <Link to={item.href} onClick={isMobile ? toggleSidebar : undefined}>
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </Button>
            ))}
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-6"
              onClick={() => {
                signOut();
                if (isMobile) toggleSidebar();
              }}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Sign Out</span>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SideNavigation;
