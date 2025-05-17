import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const root = createRoot(document.getElementById("root")!);

root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </QueryClientProvider>
);
