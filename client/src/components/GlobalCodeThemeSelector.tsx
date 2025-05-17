import { Palette } from "lucide-react";
import { useCodeTheme } from "@/contexts/CodeThemeContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { type CodeTheme } from "./CodeBlock";

export default function GlobalCodeThemeSelector() {
  const { codeTheme, setCodeTheme } = useCodeTheme();
  
  const themeOptions: Array<{value: CodeTheme, label: string}> = [
    { value: "nightOwl", label: "Night Owl" },
    { value: "dracula", label: "Dracula" },
    { value: "github", label: "GitHub" },
    { value: "vsDark", label: "VS Dark" },
    { value: "vsLight", label: "VS Light" }
  ];
  
  const getThemeLabel = (theme: CodeTheme) => {
    const found = themeOptions.find(option => option.value === theme);
    return found ? found.label : "Night Owl";
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          title="Change code highlighting theme"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline">Theme: {getThemeLabel(codeTheme)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map(option => (
          <DropdownMenuItem 
            key={option.value}
            onClick={() => setCodeTheme(option.value)}
            className={codeTheme === option.value ? "bg-slate-100 dark:bg-slate-800" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}