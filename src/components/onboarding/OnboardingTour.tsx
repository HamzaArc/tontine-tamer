
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type TourStep = {
  title: string;
  description: string;
  route: string;
  element?: string;
  selector?: string;
  spotlightContent?: React.ReactNode;
};

export const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const [completedTour, setCompletedTour] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const tourSteps: TourStep[] = [
    {
      title: 'Welcome to Tontine App',
      description: 'This tour will guide you through the main features of the application. Let\'s get started!',
      route: '/dashboard',
    },
    {
      title: 'Dashboard Overview',
      description: 'The dashboard gives you a quick overview of your tontines, upcoming payments, and recent activity.',
      route: '/dashboard',
      selector: '.dashboard-summary',
    },
    {
      title: 'Create a Tontine',
      description: 'Start by creating a tontine. Click on "Create Tontine" to set up a new savings group.',
      route: '/tontines',
      selector: '[data-tour="create-tontine-button"]',
    },
    {
      title: 'Manage Tontines',
      description: 'View and manage all your tontines from this page. You can add members and create payment cycles.',
      route: '/tontines',
      selector: '.tontine-list',
    },
    {
      title: 'Payment Cycles',
      description: 'Set up payment cycles for your tontine and assign recipients for each cycle.',
      route: '/cycles',
      selector: '[data-tour="cycles-list"]',
    },
    {
      title: 'Record Payments',
      description: 'Track payments from tontine members to ensure everyone contributes on time.',
      route: '/payments',
      selector: '[data-tour="payments-list"]',
    },
    {
      title: 'View Reports',
      description: 'Generate reports to analyze your tontine\'s performance and member activity.',
      route: '/reports',
      selector: '[data-tour="reports-dashboard"]',
    },
  ];

  useEffect(() => {
    const checkTourCompletion = async () => {
      if (!user) return;

      try {
        // Use localStorage as a fallback since completed_tour doesn't exist on profiles yet
        const hasCompletedTour = localStorage.getItem(`tour_completed_${user.id}`);
        if (hasCompletedTour === 'true') {
          setCompletedTour(true);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // We'll just use localStorage since the field doesn't exist yet
        setCompletedTour(false);
      } catch (error) {
        console.error('Error checking tour completion:', error);
      }
    };

    checkTourCompletion();
  }, [user]);

  useEffect(() => {
    if (user && !completedTour && location.pathname === '/dashboard') {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, completedTour, location.pathname]);

  useEffect(() => {
    if (isTourActive && currentStep < tourSteps.length) {
      const targetRoute = tourSteps[currentStep].route;
      
      if (location.pathname !== targetRoute) {
        navigate(targetRoute);
        return;
      }
      
      const selector = tourSteps[currentStep].selector;
      if (selector) {
        const timer = setTimeout(() => {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            setHighlightedElement(element);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            element.classList.add('tour-highlight');
            
            const rect = element.getBoundingClientRect();
            const tourTooltip = document.querySelector('.tour-tooltip') as HTMLElement;
            if (tourTooltip) {
              if (rect.top < window.innerHeight / 2) {
                tourTooltip.style.top = `${rect.bottom + window.scrollY + 20}px`;
              } else {
                tourTooltip.style.top = `${rect.top + window.scrollY - tourTooltip.offsetHeight - 20}px`;
              }
              
              tourTooltip.style.left = `${Math.max(20, rect.left + rect.width / 2 - tourTooltip.offsetWidth / 2)}px`;
            }
          }
        }, 500);
        
        return () => {
          clearTimeout(timer);
          if (highlightedElement) {
            highlightedElement.classList.remove('tour-highlight');
          }
        };
      }
    }
  }, [currentStep, isTourActive, location.pathname, navigate, tourSteps]);

  const markTourAsCompleted = async () => {
    if (!user) return;
    
    try {
      // Store completion status in localStorage as a temporary solution
      localStorage.setItem(`tour_completed_${user.id}`, 'true');
      
      // We'll update in Supabase once the field is added
      setCompletedTour(true);
      console.log('Tour marked as completed for user:', user.id);
    } catch (error) {
      console.error('Error updating tour completion status:', error);
    }
  };

  const startTour = () => {
    setCurrentStep(0);
    setIsTourActive(true);
    setIsOpen(false);
    
    toast({
      title: 'Tour Started',
      description: 'Follow the steps to learn how to use the app.',
    });
    
    navigate(tourSteps[0].route);
    
    const style = document.createElement('style');
    style.id = 'tour-styles';
    style.innerHTML = `
      .tour-highlight {
        position: relative;
        z-index: 100;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 0 8px rgba(99, 102, 241, 0.3) !important;
        border-radius: 4px;
        transition: box-shadow 0.3s ease;
      }
      .tour-tooltip {
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  };

  const endTour = async () => {
    setIsTourActive(false);
    
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
    }
    
    const tourStyles = document.getElementById('tour-styles');
    if (tourStyles) {
      tourStyles.remove();
    }
    
    toast({
      title: 'Tour Ended',
      description: 'You can restart the tour anytime from the help icon.',
    });
    
    setCompletedTour(true);
    await markTourAsCompleted();
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
      
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(true)}
              className="relative"
            >
              <BookOpen className="h-5 w-5" />
              <span className="sr-only">Product Tour</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Product Tour</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Welcome to Tontine App</DialogTitle>
            <DialogDescription>
              Would you like a guided tour of the application?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Our guided tour will show you:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>How to create and manage tontines</li>
              <li>Adding members and inviting them</li>
              <li>Setting up payment cycles</li>
              <li>Recording and tracking payments</li>
              <li>Viewing reports and analytics</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsOpen(false);
              markTourAsCompleted();
            }}>
              Skip Tour
            </Button>
            <Button onClick={startTour}>
              Start Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isTourActive && (
        <div 
          className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 w-96 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 tour-tooltip"
          style={{ maxWidth: '90vw' }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">
              Step {currentStep + 1} of {tourSteps.length}
            </h3>
            <Button variant="ghost" size="icon" onClick={endTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <h4 className="font-semibold text-primary">
            {tourSteps[currentStep].title}
          </h4>
          <p className="my-2 text-sm text-gray-600 dark:text-gray-300">
            {tourSteps[currentStep].description}
          </p>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button 
              size="sm" 
              onClick={nextStep}
            >
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
              {currentStep < tourSteps.length - 1 && (
                <ArrowRight className="ml-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
