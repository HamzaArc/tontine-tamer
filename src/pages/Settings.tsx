
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell, Mail, CreditCard, Lock, Languages, Moon, Save, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
  cycleUpdates: z.boolean().default(true),
  memberActivity: z.boolean().default(false),
});

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["en", "fr", "es"]),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("notifications");
  const [isLoading, setIsLoading] = useState(false);

  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      paymentReminders: true,
      cycleUpdates: true,
      memberActivity: false,
    },
  });

  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "system",
      language: "en",
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onNotificationsSubmit = async (data: NotificationsFormValues) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Notification settings saved:', data);
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
      setIsLoading(false);
    }, 1000);
  };

  const onAppearanceSubmit = async (data: AppearanceFormValues) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Appearance settings saved:', data);
      toast({
        title: "Appearance settings updated",
        description: "Your appearance preferences have been saved",
      });
      setIsLoading(false);
    }, 1000);
  };

  const onSecuritySubmit = async (data: SecurityFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Example of how to update password with Supabase
      // const { error } = await supabase.auth.updateUser({ 
      //   password: data.newPassword
      // });
      
      // if (error) throw error;
      
      // Since we're not actually changing the password in this demo, we'll just show a toast
      console.log('Password change requested');
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed",
      });
      
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer title="Settings">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-6">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <Card>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)}>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Configure how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNotifications">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              Email Notifications
                            </div>
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <FormField
                          control={notificationsForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pushNotifications">
                            <div className="flex items-center">
                              <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                              Push Notifications
                            </div>
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications on this device
                          </p>
                        </div>
                        <FormField
                          control={notificationsForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                      <div className="space-y-4">
                        <FormField
                          control={notificationsForm.control}
                          name="paymentReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>Payment Reminders</FormLabel>
                                <FormDescription>
                                  Get reminded when payments are due
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="cycleUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>Cycle Updates</FormLabel>
                                <FormDescription>
                                  Receive updates when cycles begin or end
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="memberActivity"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>Member Activity</FormLabel>
                                <FormDescription>
                                  Get notified about member actions and payments
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize how the app looks and feels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={appearanceForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <div className="flex items-center">
                              <Moon className="h-4 w-4 mr-2 text-muted-foreground" />
                              Theme
                            </div>
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a theme for the application interface
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appearanceForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <div className="flex items-center">
                              <Languages className="h-4 w-4 mr-2 text-muted-foreground" />
                              Language
                            </div>
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select your preferred language
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <div className="flex items-center">
                                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                                Current Password
                              </div>
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Must be at least 8 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Settings;
