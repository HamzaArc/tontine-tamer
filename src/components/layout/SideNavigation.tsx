
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  Home, 
  Users, 
  Calendar, 
  CreditCard, 
  PieChart, 
  Settings, 
  ChevronRight, 
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const SideNavigation: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tontines', path: '/tontines', icon: Users },
    { name: 'Cycles', path: '/cycles', icon: Calendar },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: PieChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
  
  return (
    <div 
      className={cn(
        "h-screen flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link to="/" className={cn("flex items-center", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            T
          </div>
          {!collapsed && (
            <span className="ml-2 font-semibold text-lg">TontineTamer</span>
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="ml-2"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2 rounded-md transition-colors",
                location.pathname === item.path 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground/60 hover:bg-primary/5 hover:text-primary",
                collapsed ? "justify-center" : ""
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center p-3 rounded-md glass",
          collapsed ? "justify-center" : ""
        )}>
          {!collapsed ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Storage</p>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground">30% of 5GB used</p>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">30%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideNavigation;
