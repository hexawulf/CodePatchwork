import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">About CodePatchwork</DialogTitle>
          <DialogDescription className="text-center">
            A modern visual Code Snippet organization and transformation tool
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="py-4">
          <h2 className="text-xl font-semibold text-center text-primary">
            CodePatchwork v1.0.0
          </h2>
          <p className="text-center text-muted-foreground text-sm mt-1">
            Released {currentDate}
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Overview</h3>
            <p className="mt-2 text-sm">
              CodePatchwork is a visual code snippet manager that combines the visual appeal of Pinterest with the functionality of GitHub Gists. It transforms how developers manage code snippets by replacing scattered text files and notes with a visually appealing, searchable repository.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Key Features</h3>
            <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
              <li>Visual organization with Pinterest-style interface</li>
              <li>Syntax highlighting for 100+ programming languages</li>
              <li>Powerful search and filtering capabilities</li>
              <li>Collections for organizing related snippets</li>
              <li>Social sharing with customizable links</li>
              <li>Tagging system for better discoverability</li>
              <li>Google Authentication for secure access</li>
              <li>Dark/Light mode for comfortable coding</li>
              <li>Import/Export functionality</li>
              <li>Responsive design for all devices</li>
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Technology</h3>
            <p className="mt-2 text-sm">
              Built with React, TypeScript, Express, PostgreSQL, and Firebase. Uses TailwindCSS for styling, Prism.js for code highlighting, and Drizzle ORM for database operations.
            </p>
          </div>

          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-center">Contact</h3>
            <div className="flex flex-col items-center mt-2 text-sm">
              <p>Author: 0xWulf</p>
              <p>Email: dev@0xwulf.dev</p>
              <a 
                href="https://github.com/hexawulf/CodePatchwork" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                GitHub Repository
              </a>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}