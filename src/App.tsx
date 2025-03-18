
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import SideNavigation from "./components/layout/SideNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* App Layout with Sidebar */}
          <Route 
            path="/dashboard" 
            element={
              <div className="flex w-full">
                <SideNavigation />
                <Dashboard />
              </div>
            } 
          />
          
          {/* Placeholder routes that would use the same layout */}
          <Route 
            path="/tontines" 
            element={
              <div className="flex w-full">
                <SideNavigation />
                <div className="flex-1 p-8">
                  <h1 className="text-2xl font-bold mb-4">Tontines</h1>
                  <p>Tontine management page coming soon.</p>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/cycles" 
            element={
              <div className="flex w-full">
                <SideNavigation />
                <div className="flex-1 p-8">
                  <h1 className="text-2xl font-bold mb-4">Cycles</h1>
                  <p>Cycle management page coming soon.</p>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/payments" 
            element={
              <div className="flex w-full">
                <SideNavigation />
                <div className="flex-1 p-8">
                  <h1 className="text-2xl font-bold mb-4">Payments</h1>
                  <p>Payment management page coming soon.</p>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              <div className="flex w-full">
                <SideNavigation />
                <div className="flex-1 p-8">
                  <h1 className="text-2xl font-bold mb-4">Reports</h1>
                  <p>Reports page coming soon.</p>
                </div>
              </div>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <div className="flex w-full">
                <SideNavigation />
                <div className="flex-1 p-8">
                  <h1 className="text-2xl font-bold mb-4">Settings</h1>
                  <p>Settings page coming soon.</p>
                </div>
              </div>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
