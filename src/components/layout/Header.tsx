
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Settings, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Mock notifications for now - these would come from a database in a real implementation
  const notifications = [
    { 
      id: 1, 
      title: 'New Payment', 
      message: 'John Doe has made a payment to your tontine.',
      time: '10 minutes ago',
      read: false
    },
    { 
      id: 2, 
      title: 'Cycle Completed', 
      message: 'The monthly cycle for Family Tontine has been completed.',
      time: '2 hours ago',
      read: false
    },
    { 
      id: 3, 
      title: 'New Member', 
      message: 'Sarah has joined your Vacation Fund tontine.',
      time: '1 day ago',
      read: true
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const markAllAsRead = () => {
    // In a real implementation, this would update the database
    toast({
      title: "Notifications marked as read",
      description: "All notifications have been marked as read.",
    });
    setNotificationOpen(false);
  };

  return (
    <header className="w-full h-16 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <h1 className="text-xl font-medium">{title}</h1>
      
      <div className="flex items-center space-x-4">
        <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {notifications.filter(n => !n.read).length}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[360px] sm:w-[540px]">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-120px)] mt-2 pr-4">
              {notifications.length > 0 ? (
                <div className="space-y-4 py-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-lg border ${notification.read ? 'bg-background' : 'bg-muted'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 animate-fade-in">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
