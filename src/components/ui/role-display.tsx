
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from './role-badge';
import { useUserRole } from '@/hooks/useUserRole';
import { Separator } from './separator';
import { Shield, Crown, User } from 'lucide-react';

interface RoleDisplayProps {
  tontineId: string;
  tontineName: string;
}

export const RoleDisplay: React.FC<RoleDisplayProps> = ({ tontineId, tontineName }) => {
  const { role, loading } = useUserRole(tontineId);
  
  if (loading) {
    return <div>Loading role information...</div>;
  }
  
  const roleInfo = {
    admin: {
      title: 'Administrator',
      icon: <Shield className="h-5 w-5 text-primary" />,
      description: 'You have full control over this tontine. You can manage members, cycles, and payments.',
      permissions: [
        'Create and manage payment cycles',
        'Add and remove members',
        'Record payments for all members',
        'View financial reports',
        'Complete payment cycles',
        'Edit tontine settings'
      ]
    },
    recipient: {
      title: 'Current Recipient',
      icon: <Crown className="h-5 w-5 text-green-500" />,
      description: 'You are the recipient for the active payment cycle. You can record payments and send reminders.',
      permissions: [
        'Record payments for all members',
        'Send payment reminders',
        'View payment status',
        'Access payment history',
        'View financial reports'
      ]
    },
    member: {
      title: 'Member',
      icon: <User className="h-5 w-5 text-muted-foreground" />,
      description: 'You are a standard member of this tontine. You can view tontine details and payment history.',
      permissions: [
        'View tontine details',
        'Access payment history',
        'View cycle information',
        'See upcoming payment dates',
        'View financial reports'
      ]
    }
  };
  
  if (!role) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">No Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have any role in this tontine.</p>
        </CardContent>
      </Card>
    );
  }
  
  const currentRole = roleInfo[role];
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Your Role in {tontineName}</CardTitle>
          <RoleBadge role={role} className="ml-2" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 mb-4">
          {currentRole.icon}
          <h3 className="text-lg font-medium">{currentRole.title}</h3>
        </div>
        <p className="text-muted-foreground mb-4">{currentRole.description}</p>
        <Separator className="my-4" />
        <div>
          <h4 className="text-sm font-medium mb-2">Your Permissions:</h4>
          <ul className="space-y-1">
            {currentRole.permissions.map((permission, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                {permission}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Roles are assigned automatically based on your relationship with the tontine.
      </CardFooter>
    </Card>
  );
};
