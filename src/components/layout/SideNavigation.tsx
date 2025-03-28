
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, PieChart, CalendarDays, CreditCard, Users, Settings, LogOut, UserCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface SideNavigationProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

const SideNavigation: React.FC<SideNavigationProps> = ({ mobile, onNavigate }) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [hasTontines, setHasTontines] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setHasTontines(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Check if the user has any tontines (either created or is a member of)
        const { data: userTontines, error: tontinesError } = await supabase
          .from('tontines')
          .select('id')
          .limit(1);
        
        if (tontinesError) {
          console.error('Error fetching tontines:', tontinesError);
          setHasTontines(false);
        } else {
          setHasTontines(userTontines && userTontines.length > 0);
        }
        
        // Check if user is an admin of any tontine
        const { data: adminTontines, error: adminError } = await supabase
          .from('tontines')
          .select('id')
          .eq('created_by', user.id)
          .limit(1);
        
        if (adminError) {
          console.error('Error checking admin status:', adminError);
          setIsAdmin(false);
        } else {
          setIsAdmin(adminTontines && adminTontines.length > 0);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRoles();
  }, [user]);
  
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
      condition: !loading,
    },
    {
      name: 'Cycles',
      href: '/cycles',
      icon: <CalendarDays className="h-5 w-5" />,
      condition: hasTontines,
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: <CreditCard className="h-5 w-5" />,
      condition: isAdmin,
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
  
  // Filter navigation items based on conditions
  const filteredNavigationItems = navigationItems.filter(item => 
    item.condition === undefined || item.condition
  );
  
  return (
    <div className={cn(
      "h-screen flex-shrink-0 border-r bg-background",
      mobile ? "fixed z-50 w-64" : "w-64"
    )}>
      <ScrollArea className="h-full py-6">
        <div className="flex flex-col h-full px-3 py-2">
          <div className="mb-10 px-4">
            <Link to="/dashboard" className="flex items-center gap-2" onClick={mobile ? onNavigate : undefined}>
              <div className="font-bold text-xl">
                Tontine<span className="text-primary">Tamer</span>
              </div>
            </Link>
          </div>
          
          <div className="space-y-1">
            {filteredNavigationItems.map((item) => (
              <Button
                key={item.href}
                variant={isActivePath(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActivePath(item.href) ? "bg-secondary" : ""
                )}
                asChild
              >
                <Link to={item.href} onClick={mobile ? onNavigate : undefined}>
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
                if (mobile) onNavigate?.();
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
