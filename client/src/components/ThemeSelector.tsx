import { useState } from "react";
import { CodeTheme } from "./CodeHighlighter";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ThemeSelectorProps {
  currentTheme: CodeTheme;
  onThemeChange: (theme: CodeTheme) => void;
  label?: boolean;
}

export default function ThemeSelector({
  currentTheme,
  onThemeChange,
  label = false
}: ThemeSelectorProps) {
  const { toast } = useToast();
  const themes: Array<{ value: CodeTheme; label: string }> = [
    { value: "nightOwl", label: "Night Owl" },
    { value: "dracula", label: "Dracula" },
    { value: "github", label: "GitHub" },
    { value: "vsDark", label: "VS Dark" },
    { value: "vsLight", label: "VS Light" },
    { value: "palenight", label: "Palenight" },
    { value: "duotoneDark", label: "Duotone Dark" },
    { value: "duotoneLight", label: "Duotone Light" },
    { value: "oceanicNext", label: "Oceanic Next" },
    { value: "okaidia", label: "Okaidia" },
  ];

  const handleThemeChange = (value: string) => {
    // Type assertion as we know the value will be one of the CodeTheme values
    const newTheme = value as CodeTheme;
    onThemeChange(newTheme);
    
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${themes.find(t => t.value === newTheme)?.label}`,
      duration: 2000
    });
  };

  return (
    <div className="flex items-center gap-2">
      {label && <Label htmlFor="theme-select" className="text-sm">Theme:</Label>}
      <Select value={currentTheme} onValueChange={handleThemeChange}>
        <SelectTrigger id="theme-select" className="w-[180px]">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Code Themes</SelectLabel>
            {themes.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}