
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

interface UserRole {
  tontineId: string;
  role: 'admin' | 'member' | 'recipient';
}

const SideNavigation: React.FC<SideNavigationProps> = ({ mobile, onNavigate }) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get tontines created by the user (admin role)
        const { data: adminTontines, error: adminError } = await supabase
          .from('tontines')
          .select('id')
          .eq('created_by', user.id);
          
        if (adminError) throw adminError;
        
        // Get tontines where the user is a member
        const { data: memberTontines, error: memberError } = await supabase
          .from('members')
          .select('tontine_id')
          .eq('email', user.email)
          .eq('is_active', true);
          
        if (memberError) throw memberError;
        
        // Get tontines where the user is a recipient of the active cycle
        const { data: activeCycles, error: cyclesError } = await supabase
          .from('cycles')
          .select('tontine_id, recipient_id, members(email)')
          .eq('status', 'active')
          .eq('members.email', user.email);
          
        if (cyclesError) throw cyclesError;
        
        // Combine all roles
        const rolesMap = new Map<string, UserRole>();
        
        // Add admin roles
        adminTontines?.forEach(tontine => {
          rolesMap.set(tontine.id, { tontineId: tontine.id, role: 'admin' });
        });
        
        // Add member roles (if not already admin)
        memberTontines?.forEach(membership => {
          if (!rolesMap.has(membership.tontine_id)) {
            rolesMap.set(membership.tontine_id, { 
              tontineId: membership.tontine_id, 
              role: 'member' 
            });
          }
        });
        
        // Add recipient roles (overrides member but not admin)
        activeCycles?.forEach(cycle => {
          if (cycle.recipient_id && cycle.members?.email === user.email) {
            if (rolesMap.has(cycle.tontine_id) && rolesMap.get(cycle.tontine_id)?.role !== 'admin') {
              rolesMap.set(cycle.tontine_id, { 
                tontineId: cycle.tontine_id, 
                role: 'recipient'
              });
            }
          }
        });
        
        setUserRoles(Array.from(rolesMap.values()));
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserRoles();
    }
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
      condition: userRoles.length > 0,
    },
    {
      name: 'Cycles',
      href: '/cycles',
      icon: <CalendarDays className="h-5 w-5" />,
      condition: userRoles.some(role => role.role === 'admin' || role.role === 'recipient'),
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: <CreditCard className="h-5 w-5" />,
      condition: userRoles.some(role => role.role === 'admin'),
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
