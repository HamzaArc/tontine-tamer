
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import BreadcrumbNavigation from './BreadcrumbNavigation';

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, children }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title={title} />
      <main className="flex-1 container mx-auto px-4 py-4">
        <BreadcrumbNavigation />
        <div className="space-y-4">
          {children}
        </div>
      </main>
      <div className="fixed bottom-4 right-4">
        <OnboardingTour />
      </div>
    </div>
  );
};

export default PageContainer;
