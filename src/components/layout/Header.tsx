
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Bell, Menu, LogOut, Settings, UserCircle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SideNavigation from './SideNavigation';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useToast } from '@/hooks/use-toast';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { 
      id: 1, 
      title: 'New payment received', 
      message: 'John Doe sent a payment of $500',
      time: '5 minutes ago',
      read: false
    },
    { 
      id: 2, 
      title: 'Cycle completed', 
      message: 'The cycle #3 for Family Tontine has been completed',
      time: '2 hours ago',
      read: false 
    },
    { 
      id: 3, 
      title: 'Member joined', 
      message: 'Sarah joined your tontine',
      time: '1 day ago',
      read: true 
    }
  ];

  const markAsRead = (id: number) => {
    toast({
      title: 'Notification marked as read',
      description: 'The notification has been marked as read.',
    });
    setShowNotifications(false);
  };

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    // Navigate based on notification type
    navigate('/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="md:hidden mr-2">
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SideNavigation mobile onNavigate={() => setShowMobileMenu(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <Link to="/" className="mr-6">
          <div className="flex items-center">
            <span className="hidden md:inline-block font-bold text-xl">Tontine</span>
            <span className="inline-block md:hidden font-bold text-xl">T</span>
          </div>
        </Link>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          <OnboardingTour />
          
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className="cursor-pointer flex flex-col items-start p-3"
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-center w-full">
                      <span className="font-medium">{notification.title}</span>
                      {!notification.read && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-red-500"></div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{notification.message}</span>
                    <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications
                </div>
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-center text-primary"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/signin">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
