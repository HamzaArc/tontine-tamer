
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MoreHorizontal, UserX, Loader2, Shield, Crown } from 'lucide-react';
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
import { RoleBadge } from '@/components/ui/role-badge';
import { useUserRole } from '@/hooks/useUserRole';

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
  const { role } = useUserRole(tontineId);
  const isAdmin = role === 'admin';
  
  const getMemberRole = async (memberId: string): Promise<'admin' | 'recipient' | 'member' | null> => {
    try {
      // Get the tontine creator
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('created_by')
        .eq('id', tontineId)
        .single();
        
      if (tontineError) throw tontineError;
      
      // Get the member's email
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('email')
        .eq('id', memberId)
        .single();
        
      if (memberError) throw memberError;
      
      // Check if member is admin (tontine creator)
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberData.email)
        .single();
        
      if (!userError && userData && userData.id === tontineData.created_by) {
        return 'admin';
      }
      
      // Check if member is a recipient
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('recipient_id', memberId)
        .eq('status', 'active')
        .single();
        
      if (!cycleError && cycleData) {
        return 'recipient';
      }
      
      // Default role is member
      return 'member';
    } catch (error) {
      console.error('Error determining member role:', error);
      return 'member';
    }
  };
  
  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only administrators can remove members.',
        variant: 'destructive',
      });
      return;
    }
    
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
    if (!isAdmin && role !== 'recipient') {
      toast({
        title: 'Permission Denied',
        description: 'Only administrators and recipients can send reminders.',
        variant: 'destructive',
      });
      return;
    }
    
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
      {members.map((member) => {
        const [memberRole, setMemberRole] = useState<'admin' | 'recipient' | 'member' | null>(null);
        
        React.useEffect(() => {
          const fetchMemberRole = async () => {
            const role = await getMemberRole(member.id);
            setMemberRole(role);
          };
          
          fetchMemberRole();
        }, [member.id]);
        
        return (
          <div 
            key={member.id}
            className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{member.name}</h3>
                {memberRole && <RoleBadge role={memberRole} showText={false} />}
              </div>
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
              {(isAdmin || role === 'recipient') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSendReminder(member.id, member.name)}
                  disabled={sendingReminderId === member.id || memberRole === 'admin'}
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
              )}
              
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
                  <DropdownMenuItem 
                    onSelect={() => handleSendReminder(member.id, member.name)}
                    disabled={memberRole === 'admin' || (!isAdmin && role !== 'recipient')}
                  >
                    Send Reminder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()} 
                          className="text-red-600"
                          disabled={memberRole === 'admin'}
                        >
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
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
};
