
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MoreHorizontal, UserX, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

interface MembersListProps {
  members: Member[];
  tontineId: string;
  onMemberRemoved?: () => void;
}

export const MembersList: React.FC<MembersListProps> = ({ members, tontineId, onMemberRemoved }) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  
  const handleRemoveMember = async (memberId: string, name: string) => {
    setDeletingId(memberId);
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId)
        .eq('tontine_id', tontineId);
      
      if (error) throw error;
      
      toast({
        title: 'Member removed',
        description: `${name} has been removed from the tontine.`,
      });
      
      if (onMemberRemoved) {
        onMemberRemoved();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleSendReminder = async (memberId: string, name: string) => {
    setSendingReminderId(memberId);
    
    // In a real app, this would be an API call to send an email/SMS
    // For now, we'll just simulate a delay and show a success message
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Reminder sent',
        description: `A payment reminder has been sent to ${name}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSendingReminderId(null);
    }
  };
  
  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div 
          key={member.id}
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border gap-4"
        >
          <div>
            <h3 className="font-medium">{member.name}</h3>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-1">
              <span className="text-sm text-muted-foreground flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {member.email}
              </span>
              <span className="text-sm text-muted-foreground flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {member.phone}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSendReminder(member.id, member.name)}
              disabled={sendingReminderId === member.id}
            >
              {sendingReminderId === member.id ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reminder'
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => console.log('Edit member')}>
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleSendReminder(member.id, member.name)}>
                  Send Reminder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                      <UserX className="h-4 w-4 mr-2" />
                      Remove Member
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {member.name} from this tontine?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deletingId === member.id}
                      >
                        {deletingId === member.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          'Remove'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
};
