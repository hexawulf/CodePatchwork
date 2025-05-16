import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SnippetProvider } from "./contexts/SnippetContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

const root = createRoot(document.getElementById("root")!);

root.render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SnippetProvider>
        <App />
      </SnippetProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
