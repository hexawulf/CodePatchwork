import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, User, Shield, FileText } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [editorFont, setEditorFont] = useState("Fira Code");
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [tabSize, setTabSize] = useState("2");
  
  // Mock user profile settings
  const [username, setUsername] = useState("jsdev");
  const [email, setEmail] = useState("user@example.com");
  
  // Save preferences
  const savePreferences = () => {
    toast({
      title: "Preferences saved",
      description: "Your settings have been updated successfully.",
    });
  };
  
  // Update account
  const updateAccount = () => {
    toast({
      title: "Account updated",
      description: "Your account information has been updated successfully.",
    });
  };

  return (
    <Layout>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance" className="flex items-center">
              <Sun className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Appearance Settings</h2>
            
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">System preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={savePreferences}>Save Preferences</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="editor" className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Editor Settings</h2>
            
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="editorFont">Font Family</Label>
                <Select value={editorFont} onValueChange={setEditorFont}>
                  <SelectTrigger id="editorFont">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fira Code">Fira Code (Default)</SelectItem>
                    <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                    <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                    <SelectItem value="Inconsolata">Inconsolata</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tabSize">Tab Size</Label>
                <Select value={tabSize} onValueChange={setTabSize}>
                  <SelectTrigger id="tabSize">
                    <SelectValue placeholder="Select tab size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="8">8 spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="lineNumbers" 
                  checked={showLineNumbers} 
                  onCheckedChange={setShowLineNumbers}
                />
                <Label htmlFor="lineNumbers">Show line numbers</Label>
              </div>
              
              <Button onClick={savePreferences}>Save Editor Settings</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="account" className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Account Settings</h2>
            
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              
              <Button onClick={updateAccount}>Update Account</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Security Settings</h2>
            
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              
              <Button>Change Password</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}