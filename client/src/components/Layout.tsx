import { type ReactNode, useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import SnippetDrawer from "./SnippetDrawer";
import CommandPalette from "./CommandPalette";
import AddSnippetDialog from "./AddSnippetDialog";
import ImportExportDialog from "./ImportExportDialog";
import AboutModal from "./AboutModal";
import { useSnippetContext } from "@/contexts/SnippetContext";
import { useAuthContext } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  isPublicView?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export default function Layout({ children, isPublicView = false }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthContext();
  const {
    inspectedSnippet,
    closeInspector,
    editingSnippet,
    isEditorOpen,
    openCreateEditor,
    closeEditor,
    isCommandOpen,
    setCommandOpen,
    isImportExportOpen,
    setImportExportOpen,
    isAboutOpen,
    setAboutOpen,
  } = useSnippetContext();

  // Global keyboard shortcuts: Cmd/Ctrl+K, /, n
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!isCommandOpen);
        return;
      }

      if (isEditableTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/" && !isPublicView) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === "n" && isAuthenticated && !isPublicView && !isEditorOpen) {
        e.preventDefault();
        openCreateEditor();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCommandOpen, setCommandOpen, isPublicView, isAuthenticated, isEditorOpen, openCreateEditor]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
      {!isPublicView && (
        <Sidebar className="hidden h-full w-60 shrink-0 border-r border-border md:flex" />
      )}

      {!isPublicView && mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 w-64 border-r border-border bg-card shadow-xl">
            <Sidebar className="h-full" onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          toggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
          isPublicView={isPublicView}
          searchInputRef={searchInputRef}
        />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Single global overlay instances */}
      <SnippetDrawer
        snippet={inspectedSnippet}
        onClose={closeInspector}
        isPublicView={isPublicView}
      />

      <CommandPalette />

      {isEditorOpen && (
        <AddSnippetDialog
          open={isEditorOpen}
          onOpenChange={(open) => {
            if (!open) closeEditor();
          }}
          snippetToEdit={editingSnippet}
          isEditMode={Boolean(editingSnippet)}
        />
      )}

      {isImportExportOpen && (
        <ImportExportDialog open={isImportExportOpen} onOpenChange={setImportExportOpen} />
      )}

      {isAboutOpen && <AboutModal open={isAboutOpen} onOpenChange={setAboutOpen} />}
    </div>
  );
}
