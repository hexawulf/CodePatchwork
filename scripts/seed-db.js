#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema.js';

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seedDatabase() {
  console.log('Seeding database with sample data...');
  
  try {
    // Sample snippets
    const sampleSnippets = [
      {
        title: "React useLocalStorage Hook",
        description: "Custom React hook to persist state in localStorage with type safety.",
        code: `import { useState, useEffect } from 'react';

function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T) => void] {
  // Get stored value
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading localStorage key', error);
      return initialValue;
    }
  };
  
  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  // Return a wrapped version of useState's setter
  const setValue = (value: T) => {
    try {
      // Save state
      setStoredValue(value);
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error setting localStorage key', error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [storedValue, setValue];
}`,
        language: "tsx",
        tags: ["react", "hooks", "typescript"],
        isFavorite: false,
        viewCount: 12
      },
      {
        title: "Python Decorator for Timing",
        description: "A simple Python decorator to measure and log function execution time.",
        code: `import time
import functools
import logging

def timer(func):
    """Print the runtime of the decorated function"""
    @functools.wraps(func)
    def wrapper_timer(*args, **kwargs):
        start_time = time.perf_counter()
        value = func(*args, **kwargs)
        end_time = time.perf_counter()
        run_time = end_time - start_time
        logging.info(f"Completed {func.__name__!r} in {run_time:.4f} secs")
        return value
    return wrapper_timer

# Example usage
@timer
def waste_some_time(num_times):
    for _ in range(num_times):
        sum([i**2 for i in range(10000)])
        
# Call it
waste_some_time(100)`,
        language: "python",
        tags: ["python", "decorators", "performance"],
        isFavorite: false,
        viewCount: 24
      },
      {
        title: "CSS Grid Layout Template",
        description: "Responsive grid layout with areas for header, sidebar, content and footer.",
        code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "h h h h h h h h h h h h"
    "s s c c c c c c c c c c"
    "f f f f f f f f f f f f";
  min-height: 100vh;
  gap: 1rem;
}

.header { grid-area: h; }
.sidebar { grid-area: s; }
.content { grid-area: c; }
.footer { grid-area: f; }

/* Tablet layout */
@media (max-width: 992px) {
  .grid-container {
    grid-template-areas:
      "h h h h h h h h h h h h"
      "s s s s c c c c c c c c"
      "f f f f f f f f f f f f";
  }
}

/* Mobile layout */
@media (max-width: 768px) {
  .grid-container {
    grid-template-areas:
      "h h h h h h h h h h h h"
      "c c c c c c c c c c c c"
      "s s s s s s s s s s s s"
      "f f f f f f f f f f f f";
  }
}`,
        language: "css",
        tags: ["css", "grid", "responsive"],
        isFavorite: true,
        viewCount: 41
      },
      {
        title: "JavaScript Array Methods Cheatsheet",
        description: "Quick reference for common JavaScript array methods with examples.",
        code: `/* Array methods cheatsheet */

// ADDING ELEMENTS
array.push(item);          // Add to end
array.unshift(item);       // Add to beginning
array.splice(index, 0, item); // Add at position

// REMOVING ELEMENTS
array.pop();               // Remove from end
array.shift();             // Remove from beginning
array.splice(index, 1);    // Remove at position

// TRANSFORMATION
array.map(callback);       // Create new array with results
array.filter(callback);    // Create array with elements that pass test
array.reduce(callback, initialValue); // Reduce to single value
array.sort(compareFunction); // Sort elements
array.reverse();           // Reverse order

// SEARCHING
array.find(callback);      // Find first matching element
array.findIndex(callback); // Find index of first match
array.includes(item);      // Check if array contains item
array.indexOf(item);       // Find index of item (-1 if not found)

// ITERATION
array.forEach(callback);   // Execute function on each element

// JOINING & SPLITTING
array.join(separator);     // Join elements into string
string.split(separator);   // Split string into array`,
        language: "javascript",
        tags: ["javascript", "arrays", "cheatsheet"],
        isFavorite: true,
        viewCount: 137
      },
      {
        title: "Tailwind Dark Mode Toggle",
        description: "React component for toggling dark mode with system preference detection.",
        code: `import { useState, useEffect } from 'react';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for system preference when component mounts
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(
      localStorage.getItem('darkMode') !== null
        ? localStorage.getItem('darkMode') === 'true'
        : prefersDark
    );
  }, []);

  useEffect(() => {
    // Update document class when darkMode state changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
};`,
        language: "jsx",
        tags: ["react", "tailwind", "darkmode"],
        isFavorite: false,
        viewCount: 52
      },
      {
        title: "Go Error Handling Pattern",
        description: "Best practices for handling errors in Go with custom error types.",
        code: `package main

import (
        "errors"
        "fmt"
)

// Define custom error types
type NotFoundError struct {
        ID string
}

func (e *NotFoundError) Error() string {
        return fmt.Sprintf("entity with ID %s not found", e.ID)
}

// Function that returns different error types
func GetUser(id string) (User, error) {
        // Simulate user not found
        if id == "" {
                return User{}, &NotFoundError{ID: id}
        }
        
        // Simulate another error
        if id == "invalid" {
                return User{}, errors.New("invalid user ID format")
        }
        
        // Success
        return User{ID: id, Name: "John Doe"}, nil
}

// Error handling pattern with type checking
func main() {
        user, err := GetUser("")
        if err != nil {
                // Check specific error type
                if notFoundErr, ok := err.(*NotFoundError); ok {
                        fmt.Printf("Could not find user: %v\\n", notFoundErr)
                        // Handle not found case
                } else {
                        fmt.Printf("Error getting user: %v\\n", err)
                        // Handle other errors
                }
                return
        }
        
        // Process the user
        fmt.Printf("Found user: %s\\n", user.Name)
}`,
        language: "go",
        tags: ["go", "error-handling", "best-practices"],
        isFavorite: false,
        viewCount: 18
      }
    ];

    // Insert snippets
    for (const snippet of sampleSnippets) {
      const now = new Date();
      await db.insert(schema.snippets).values({
        ...snippet,
        userId: null,
        createdAt: now,
        updatedAt: now
      });
    }

    // Create sample collections
    const collections = [
      {
        name: "React Patterns",
        description: "Collection of useful React patterns and hooks",
        userId: null
      },
      {
        name: "CSS Layouts",
        description: "Responsive CSS layout techniques",
        userId: null
      },
      {
        name: "JavaScript Essentials",
        description: "Must-know JavaScript concepts and utilities",
        userId: null
      }
    ];

    // Insert collections
    for (const collection of collections) {
      const now = new Date();
      await db.insert(schema.collections).values({
        ...collection,
        createdAt: now,
        updatedAt: now
      });
    }

    // Get the IDs of the created collections and snippets
    const collectionResults = await db.select().from(schema.collections);
    const snippetResults = await db.select().from(schema.snippets);

    // Add React useLocalStorage (1) and Tailwind Dark Mode Toggle (5) to React Patterns (1)
    await db.insert(schema.collectionItems).values({
      collectionId: collectionResults[0].id,
      snippetId: snippetResults[0].id,
      createdAt: new Date()
    });
    await db.insert(schema.collectionItems).values({
      collectionId: collectionResults[0].id,
      snippetId: snippetResults[4].id,
      createdAt: new Date()
    });

    // Add CSS Grid Layout (3) to CSS Layouts (2)
    await db.insert(schema.collectionItems).values({
      collectionId: collectionResults[1].id,
      snippetId: snippetResults[2].id,
      createdAt: new Date()
    });

    // Add JavaScript Array Methods (4) to JavaScript Essentials (3)
    await db.insert(schema.collectionItems).values({
      collectionId: collectionResults[2].id,
      snippetId: snippetResults[3].id,
      createdAt: new Date()
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();