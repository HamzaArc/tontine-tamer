
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Users, Calendar, CreditCard, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  const featureItems = [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Tontine Management",
      description: "Create and manage multiple tontine groups with different members and contribution schedules.",
    },
    {
      icon: <Calendar className="h-6 w-6 text-primary" />,
      title: "Cycle Scheduling",
      description: "Set up flexible payment schedules with automated reminders for all members.",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Payment Tracking",
      description: "Record and monitor all contributions and payouts in one secure location.",
    },
    {
      icon: <PieChart className="h-6 w-6 text-primary" />,
      title: "Reporting & Analytics",
      description: "Generate detailed reports to maintain transparency and track financial activity.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                T
              </div>
              <span className="ml-2 font-semibold text-xl">TontineTamer</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Link to="/signin" className="text-sm font-medium hover:text-primary transition-colors">
                    Sign In
                  </Link>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:py-24 lg:px-8 text-center bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-8 animate-pulse">
            <span className="mr-2">✨</span>
            <span>Simplify Your Tontine Management</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Manage tontines with ease and transparency
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            TontineTamer helps you create, manage, and track tontine groups with an intuitive interface designed for everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button asChild size="lg" className="px-8 rounded-full h-12">
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="px-8 rounded-full h-12">
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg" className="px-8 rounded-full h-12">
                  <Link to="/signin">
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Floating Cards */}
        <div className="relative mt-20 w-full max-w-4xl">
          <div className="absolute -top-10 -left-4 w-64 h-40 glass rounded-lg p-4 shadow-lg animate-float" style={{ animationDelay: "0.2s" }}>
            <h3 className="font-medium mb-2">Family Savings</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Members</span>
              <span>8</span>
            </div>
            <div className="w-full h-2 bg-primary/20 rounded-full mb-2">
              <div className="h-full w-3/4 bg-primary rounded-full"></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cycle Progress</span>
              <span>75%</span>
            </div>
          </div>
          
          <div className="absolute -top-8 right-12 w-56 h-36 glass rounded-lg p-4 shadow-lg animate-float" style={{ animationDelay: "0.5s" }}>
            <h3 className="font-medium mb-2">Work Group</h3>
            <div className="flex justify-between text-sm mb-1">
              <span>Next Payment</span>
              <span>May 20</span>
            </div>
            <div className="mt-2 p-2 bg-primary/10 rounded text-sm font-medium text-center text-primary">
              $150.00 Due
            </div>
          </div>
          
          <div className="absolute top-20 right-0 w-60 h-44 glass rounded-lg p-4 shadow-lg animate-float" style={{ animationDelay: "0.8s" }}>
            <h3 className="font-medium mb-2">Friends Tontine</h3>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-sm">
                <span>Alice</span>
                <span className="text-green-500">Paid</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bob</span>
                <span className="text-green-500">Paid</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Charlie</span>
                <span className="text-red-500">Due</span>
              </div>
            </div>
          </div>
          
          <div className="h-56 w-full"></div> {/* Spacer for floating cards */}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to manage tontines</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform simplifies the entire process of creating and managing tontine groups.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureItems.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-xl border border-border card-hover animate-fade-in" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">Ready to simplify your tontine management?</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of users who are already benefiting from our secure and user-friendly platform.
          </p>
          {user ? (
            <Button asChild size="lg" className="px-8 rounded-full h-12">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="px-8 rounded-full h-12">
              <Link to="/signup">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                T
              </div>
              <span className="ml-2 font-semibold">TontineTamer</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2023 TontineTamer. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-muted-foreground">Made with care for tontine communities worldwide</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
