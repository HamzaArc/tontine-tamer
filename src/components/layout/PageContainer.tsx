
import React, { useEffect, useState } from 'react';
import Header from './Header';

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen">
      <Header title={title} />
      <main className={`flex-1 p-6 overflow-auto transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
