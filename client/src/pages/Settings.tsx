import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import {
  usePreferences,
  type CodeTheme,
  type EditorFont,
  type TabSize,
  type ViewMode,
} from "@/contexts/PreferencesContext";
import { useAuthContext } from "@/contexts/AuthContext";
import CodeBlock from "@/components/CodeBlock";
import { Moon, Sun, User, FileText, RotateCcw } from "lucide-react";

const PREVIEW_SAMPLE = `export function greet(name: string): string {
  return \`Hello, \${name} — welcome to CodePatchwork 2.0\`;
}`;

export default function Settings() {
  const { toast } = useToast();
  const { preference, setTheme } = useTheme();
  const { prefs, updatePrefs, resetPrefs } = usePreferences();
  const { user } = useAuthContext();

  const handleReset = () => {
    resetPrefs();
    toast({
      title: "Preferences reset",
      description: "Restored default editor and appearance preferences.",
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              All appearance and code display preferences save automatically.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance" className="gap-1.5">
              <Sun className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Code &amp; Editor
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="theme">UI Theme</Label>
              <Select
                value={preference}
                onValueChange={(value) => setTheme(value as ThemePreference)}
              >
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">System preference</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="codeTheme">Syntax Highlighting Theme</Label>
              <Select
                value={prefs.codeTheme}
                onValueChange={(value) => updatePrefs({ codeTheme: value as CodeTheme })}
              >
                <SelectTrigger id="codeTheme">
                  <SelectValue placeholder="Select syntax theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nightOwl">Night Owl</SelectItem>
                  <SelectItem value="dracula">Dracula</SelectItem>
                  <SelectItem value="github">GitHub Light</SelectItem>
                  <SelectItem value="vsDark">VS Dark</SelectItem>
                  <SelectItem value="vsLight">VS Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="defaultView">Default Library Layout</Label>
              <Select
                value={prefs.defaultViewMode}
                onValueChange={(value) => updatePrefs({ defaultViewMode: value as ViewMode })}
              >
                <SelectTrigger id="defaultView">
                  <SelectValue placeholder="Select default layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid cards</SelectItem>
                  <SelectItem value="list">Compact list</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div className="overflow-hidden rounded-lg border border-border">
                <CodeBlock code={PREVIEW_SAMPLE} language="typescript" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="editorFont">Code Font Family</Label>
              <Select
                value={prefs.editorFont}
                onValueChange={(value) => updatePrefs({ editorFont: value as EditorFont })}
              >
                <SelectTrigger id="editorFont">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fira Code">Fira Code (Default)</SelectItem>
                  <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                  <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                  <SelectItem value="Inconsolata">Inconsolata</SelectItem>
                  <SelectItem value="monospace">System Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tabSize">Tab Indentation</Label>
              <Select
                value={String(prefs.tabSize)}
                onValueChange={(value) => updatePrefs({ tabSize: Number(value) as TabSize })}
              >
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

            <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <div>
                <Label htmlFor="lineNumbers" className="cursor-pointer">
                  Show line numbers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display gutter line numbers in full snippet views.
                </p>
              </div>
              <Switch
                id="lineNumbers"
                checked={prefs.showLineNumbers}
                onCheckedChange={(checked) => updatePrefs({ showLineNumbers: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <div>
                <Label htmlFor="wordWrap" className="cursor-pointer">
                  Word wrap long lines
                </Label>
                <p className="text-xs text-muted-foreground">
                  Wrap long code lines instead of scrolling horizontally.
                </p>
              </div>
              <Switch
                id="wordWrap"
                checked={prefs.wordWrap}
                onCheckedChange={(checked) => updatePrefs({ wordWrap: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div className="overflow-hidden rounded-lg border border-border">
                <CodeBlock code={PREVIEW_SAMPLE} language="typescript" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account" className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={user?.displayName || ""} readOnly disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} readOnly disabled />
            </div>

            <p className="text-xs text-muted-foreground">
              Profile and authentication are managed via your Google account.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
