import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile, visible on larger screens */}
      <Sidebar className="w-full md:w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 hidden md:block h-full overflow-y-auto" />

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 ${mobileMenuOpen ? "" : "hidden"}`}>
        <div 
          className="absolute inset-0 bg-black/50 dark:bg-black/70" 
          onClick={closeMobileMenu}
        ></div>
        <div className={`absolute top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ${mobileMenuOpen ? "" : "-translate-x-full"}`}>
          <Sidebar onClose={closeMobileMenu} />
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <Header toggleMobileMenu={toggleMobileMenu} />
        
        {/* Main Content Area - FIXED */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-gray-800 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
