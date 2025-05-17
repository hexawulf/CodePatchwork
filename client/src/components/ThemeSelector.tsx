import { useEffect, useState } from "react";
import { CodeTheme } from "./CodeBlock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ThemeSelectorProps {
  value?: CodeTheme;
  onChange?: (theme: CodeTheme) => void;
  showLabel?: boolean;
}

export default function ThemeSelector({
  value = "nightOwl",
  onChange,
  showLabel = false
}: ThemeSelectorProps) {
  const [theme, setTheme] = useState<CodeTheme>(value);
  
  // Sync with external value
  useEffect(() => {
    if (value !== theme) {
      setTheme(value);
    }
  }, [value]);

  const handleChange = (newTheme: string) => {
    const validTheme = newTheme as CodeTheme;
    setTheme(validTheme);
    if (onChange) {
      onChange(validTheme);
    }
  };
  
  const themes = [
    { value: "nightOwl", label: "Night Owl" },
    { value: "dracula", label: "Dracula" },
    { value: "github", label: "GitHub" },
    { value: "vsDark", label: "VS Dark" },
    { value: "vsLight", label: "VS Light" }
  ];

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <Label htmlFor="theme-select">Theme:</Label>
      )}
      <Select
        value={theme}
        onValueChange={handleChange}
      >
        <SelectTrigger id="theme-select" className="w-[140px]">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}