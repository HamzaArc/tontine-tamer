
import { useCallback } from 'react';
import { useNotification, NotificationType } from '@/contexts/NotificationContext';

export function useAppNotification() {
  const { addNotification, removeNotification, clearAllNotifications } = useNotification();

  // Welcome notification
  const showWelcomeNotification = useCallback(() => {
    return addNotification({
      title: 'Welcome to Tontine Manager!',
      message: 'Get started by creating your first tontine or exploring the dashboard.',
      type: 'info',
      duration: 10000,
    });
  }, [addNotification]);

  // Onboarding completion
  const showOnboardingCompleteNotification = useCallback(() => {
    return addNotification({
      title: 'Onboarding Complete',
      message: 'You have successfully set up your account. Now you can start managing your tontines!',
      type: 'success',
      duration: 8000,
    });
  }, [addNotification]);

  // Account verification
  const showVerificationNotification = useCallback(() => {
    return addNotification({
      title: 'Verify Your Email',
      message: 'Please check your inbox for a verification email to complete your account setup.',
      type: 'info',
      duration: 15000,
    });
  }, [addNotification]);

  // Security alert
  const showSecurityAlertNotification = useCallback((device: string) => {
    return addNotification({
      title: 'New Login Detected',
      message: `A new login was detected from ${device}. If this wasn't you, please update your password immediately.`,
      type: 'warning',
      duration: 20000,
    });
  }, [addNotification]);

  // Group creation
  const showGroupCreatedNotification = useCallback((groupName: string) => {
    return addNotification({
      title: 'Tontine Created',
      message: `Your new tontine "${groupName}" has been successfully created.`,
      type: 'success',
      duration: 8000,
    });
  }, [addNotification]);

  // Group update
  const showGroupUpdatedNotification = useCallback(() => {
    return addNotification({
      title: 'Tontine Updated',
      message: 'Your tontine information has been successfully updated.',
      type: 'info',
      duration: 6000,
    });
  }, [addNotification]);

  // Invitation status
  const showInvitationNotification = useCallback((memberName: string, status: 'accepted' | 'declined') => {
    return addNotification({
      title: 'Invitation Update',
      message: `${memberName} has ${status} your invitation to join the tontine.`,
      type: status === 'accepted' ? 'success' : 'info',
      duration: 8000,
    });
  }, [addNotification]);

  // Contribution recorded
  const showContributionRecordedNotification = useCallback((memberName: string, amount: number) => {
    return addNotification({
      title: 'Payment Recorded',
      message: `A payment of $${amount} from ${memberName} has been successfully recorded.`,
      type: 'success',
      duration: 6000,
    });
  }, [addNotification]);

  // Missed contribution reminder
  const showMissedContributionNotification = useCallback((memberName: string, dueDate: string) => {
    return addNotification({
      title: 'Missed Payment',
      message: `${memberName} has not recorded their payment due on ${dueDate}.`,
      type: 'warning',
      duration: 10000,
    });
  }, [addNotification]);

  // Upcoming payment reminder
  const showUpcomingPaymentNotification = useCallback((dueDate: string) => {
    return addNotification({
      title: 'Upcoming Payment',
      message: `You have a payment due on ${dueDate}. Please make arrangements to complete it on time.`,
      type: 'info',
      duration: 8000,
    });
  }, [addNotification]);

  // Schedule change alert
  const showScheduleChangeNotification = useCallback((cycleName: string) => {
    return addNotification({
      title: 'Schedule Changed',
      message: `The payment schedule for ${cycleName} has been updated. Please check the new dates.`,
      type: 'info',
      duration: 10000,
    });
  }, [addNotification]);

  // New report available
  const showReportAvailableNotification = useCallback((reportType: string) => {
    return addNotification({
      title: 'New Report Available',
      message: `Your ${reportType} report is now available for review.`,
      type: 'info',
      duration: 8000,
    });
  }, [addNotification]);

  // Custom notification
  const showCustomNotification = useCallback((title: string, message: string, type: NotificationType = 'default', duration?: number) => {
    return addNotification({
      title,
      message,
      type,
      duration,
    });
  }, [addNotification]);

  return {
    showWelcomeNotification,
    showOnboardingCompleteNotification,
    showVerificationNotification,
    showSecurityAlertNotification,
    showGroupCreatedNotification,
    showGroupUpdatedNotification,
    showInvitationNotification,
    showContributionRecordedNotification,
    showMissedContributionNotification,
    showUpcomingPaymentNotification,
    showScheduleChangeNotification,
    showReportAvailableNotification,
    showCustomNotification,
    removeNotification,
    clearAllNotifications,
  };
}
