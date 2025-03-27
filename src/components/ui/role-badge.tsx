
import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Crown, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type RoleType = 'admin' | 'recipient' | 'member' | null;

interface RoleBadgeProps {
  role: RoleType;
  showText?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  showText = true,
  className 
}) => {
  if (!role) return null;
  
  const config = {
    admin: {
      icon: <Shield className="h-3 w-3" />,
      text: 'Admin',
      variant: 'default' as const,
      color: 'bg-primary'
    },
    recipient: {
      icon: <Crown className="h-3 w-3" />,
      text: 'Recipient',
      variant: 'success' as const,
      color: 'bg-green-500'
    },
    member: {
      icon: <User className="h-3 w-3" />,
      text: 'Member',
      variant: 'secondary' as const,
      color: 'bg-secondary'
    }
  };
  
  const currentConfig = config[role];
  
  return (
    <Badge 
      variant={currentConfig.variant}
      className={cn("gap-1", className)}
    >
      {currentConfig.icon}
      {showText && currentConfig.text}
    </Badge>
  );
};
