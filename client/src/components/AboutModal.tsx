import React, { Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">About CodePatchwork</DialogTitle>
          <DialogDescription className="text-center">
            A modern visual code-snippet manager
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-6 py-4 text-sm">
          <Fragment>
            <h2 className="text-xl font-semibold text-center text-primary">
              CodePatchwork v1.0.0
            </h2>
            <p className="text-center text-muted-foreground">Released {today}</p>
          </Fragment>

          <Fragment>
            <h3 className="text-lg font-semibold">Overview</h3>
            <p>
              CodePatchwork is a Pinterest-style, searchable repository for your
              code snippets.
            </p>
          </Fragment>

          <Fragment>
            <h3 className="text-lg font-semibold">Key Features</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Visual board with drag &amp; drop</li>
              <li>Syntax highlighting (100 + languages)</li>
              <li>Tag &amp; search filters</li>
              <li>Collections, import / export</li>
              <li>Google sign-in, light / dark themes</li>
            </ul>
          </Fragment>

          <Fragment>
            <h3 className="text-lg font-semibold">Tech Stack</h3>
            <p>
              React · TypeScript · Express · PostgreSQL · Firebase · TailwindCSS ·
              Prism.js · Drizzle ORM
            </p>
          </Fragment>

          <Fragment>
            <h3 className="text-lg font-semibold text-center">Contact</h3>
            <div className="flex flex-col items-center gap-1">
              <span>Author  0xWulf</span>
              <span>Email  dev@0xwulf.dev</span>
              <a
                href="https://github.com/hexawulf/CodePatchwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
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
