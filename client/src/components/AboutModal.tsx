import { Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">About CodePatchwork</DialogTitle>
          <DialogDescription className="text-center">
            A fast, keyboard-first visual code snippet library
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-5 py-3 text-sm">
          <Fragment>
            <h2 className="text-xl font-semibold text-center text-primary">
              CodePatchwork v2.1.0
            </h2>
            <p className="text-center text-muted-foreground">Released November 2026</p>
          </Fragment>

          <Fragment>
            <h3 className="text-base font-semibold">Key Features</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Unified searchable snippet library with live language &amp; tag facets</li>
              <li>Full-screen Snippet Inspector Drawer with Markdown copy, file download &amp; comments</li>
              <li>Command Palette (⌘K) and keyboard shortcuts (/, N, G, L)</li>
              <li>Collections, drag-and-drop JSON import/export &amp; raw public sharing</li>
              <li>Persistent code themes, fonts, tab indentation, line numbers &amp; word wrap</li>
            </ul>
          </Fragment>

          <Fragment>
            <h3 className="text-base font-semibold">Tech Stack</h3>
            <p className="text-muted-foreground">
              React · TypeScript · Vite · Express · PostgreSQL · Drizzle ORM · Firebase Auth ·
              Tailwind CSS · Prism
            </p>
          </Fragment>

          <Fragment>
            <h3 className="text-base font-semibold text-center">Developer</h3>
            <div className="flex flex-col items-center gap-1">
              <span>
                Erling Wulf Weinreich (0xWulf) ·{" "}
                <a
                  href="mailto:dev@0xwulf.dev"
                  className="text-primary hover:underline"
                >
                  dev@0xwulf.dev
                </a>
              </span>
              <a
                href="https://github.com/hexawulf/CodePatchwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub Repo
              </a>
            </div>
          </Fragment>
        </section>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
