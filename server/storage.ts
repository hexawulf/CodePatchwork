import { 
  users, type User, type InsertUser,
  snippets, type Snippet, type InsertSnippet,
  collections, type Collection, type InsertCollection,
  collectionItems, type CollectionItem, type InsertCollectionItem,
  comments, type Comment, type InsertComment
} from "@shared/schema";
import { eq, and, or, isNotNull, ilike, like, sql, desc, asc } from "drizzle-orm";

// Modify the interface with any CRUD methods needed
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Snippet operations
  getSnippets(filters?: {
    search?: string;
    language?: string | string[];
    tag?: string | string[];
    favorites?: boolean;
    isPublic?: boolean;
    userId?: string; // Added userId
  }): Promise<Snippet[]>;
  getSnippet(id: number): Promise<Snippet | undefined>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: InsertSnippet): Promise<Snippet>;
  deleteSnippet(id: number): Promise<void>;
  incrementSnippetViewCount(id: number): Promise<void>;
  toggleSnippetFavorite(id: number): Promise<Snippet>;
  
  // Language and tag operations
  getLanguages(): Promise<string[]>;
  getTags(): Promise<string[]>;
  
  // Collection operations
  getCollections(): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: InsertCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;
  
  // Collection items operations
  getCollectionSnippets(collectionId: number): Promise<Snippet[]>;
  addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem>;
  removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void>;
  
  // Sharing operations
  getSnippetByShareId(shareId: string): Promise<Snippet | undefined>;
  generateShareId(snippetId: number): Promise<string>;
  toggleSnippetPublic(snippetId: number): Promise<Snippet>;
  
  // Comment operations
  getCommentsBySnippetId(snippetId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private snippets: Map<number, Snippet>;
  private collections: Map<number, Collection>;
  private collectionItems: Map<number, CollectionItem>;
  private comments: Map<number, Comment>;
  
  private userIdCounter: number;
  private snippetIdCounter: number;
  private collectionIdCounter: number;
  private collectionItemIdCounter: number;
  private commentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.snippets = new Map();
    this.collections = new Map();
    this.collectionItems = new Map();
    
    this.userIdCounter = 1;
    this.snippetIdCounter = 1;
    this.collectionIdCounter = 1;
    this.collectionItemIdCounter = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample snippets
    const sampleSnippets: InsertSnippet[] = [
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
        userId: null,
        isFavorite: false,
        viewCount: 12,
        isPublic: true
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
        userId: null,
        isFavorite: false,
        viewCount: 24,
        isPublic: false
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
        userId: null,
        isFavorite: true,
        viewCount: 41,
        isPublic: true
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
        userId: null,
        isFavorite: true,
        viewCount: 137,
        isPublic: false
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
        userId: null,
        isFavorite: false,
        viewCount: 52,
        isPublic: true
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
        userId: null,
        isFavorite: false,
        viewCount: 18,
        isPublic: false
      }
    ];

    // Add sample collections
    const sampleCollections: InsertCollection[] = [
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

    // Add all sample snippets
    sampleSnippets.forEach(snippet => {
      this.createSnippet({
        ...snippet,
        viewCount: snippet.viewCount || 0,
        isFavorite: snippet.isFavorite || false
      });
    });

    // Add all sample collections
    const collectionIds = sampleCollections.map(collection => 
      this.createCollection(collection).then(c => c.id)
    );

    // Once all collections are created, add snippets to them
    Promise.all(collectionIds).then(ids => {
      // Add React useLocalStorage and Tailwind Dark Mode Toggle to React Patterns
      this.addSnippetToCollection({ collectionId: ids[0], snippetId: 1 });
      this.addSnippetToCollection({ collectionId: ids[0], snippetId: 5 });
      
      // Add CSS Grid Layout to CSS Layouts
      this.addSnippetToCollection({ collectionId: ids[1], snippetId: 3 });
      
      // Add JavaScript Array Methods to JavaScript Essentials
      this.addSnippetToCollection({ collectionId: ids[2], snippetId: 4 });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Snippet operations
  async getSnippets(filters?: {
    search?: string;
    language?: string | string[];
    tag?: string | string[];
    favorites?: boolean;
    isPublic?: boolean;
    userId?: string; // Added userId
  }): Promise<Snippet[]> {
    let snippets = Array.from(this.snippets.values());
    
    if (filters) {
      // Filter by userId
      if (filters.userId) {
        snippets = snippets.filter(s => s.userId === filters.userId);
      }
      
      // Filter by language - support both single language and multiple languages
      if (filters.language) {
        if (Array.isArray(filters.language)) {
          // Multiple languages (logical OR)
          const languages = filters.language.map(lang => lang.toLowerCase());
          snippets = snippets.filter(s => 
            s.language && languages.includes(s.language.toLowerCase())
          );
        } else {
          // Single language
          const langLower = filters.language.toLowerCase();
          snippets = snippets.filter(s => 
            s.language && s.language.toLowerCase() === langLower
          );
        }
      }
      
      // Filter by tag - support both single tag and multiple tags
      if (filters.tag) {
        if (Array.isArray(filters.tag)) {
          // Multiple tags (logical OR)
          const tags = filters.tag.map(tag => tag.toLowerCase());
          snippets = snippets.filter(s => 
            s.tags?.some(tag => tags.includes(tag.toLowerCase()))
          );
        } else {
          // Single tag
          const tagLower = filters.tag.toLowerCase();
          snippets = snippets.filter(s => 
            s.tags?.some(tag => tag.toLowerCase() === tagLower)
          );
        }
      }
      
      // Filter by favorites
      if (filters.favorites) {
        snippets = snippets.filter(s => s.isFavorite);
      }
      
      // Filter by search term (title, description, code)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        snippets = snippets.filter(s => 
          s.title.toLowerCase().includes(searchTerm) || 
          (s.description && s.description.toLowerCase().includes(searchTerm)) ||
          (s.code && s.code.toLowerCase().includes(searchTerm))
        );
      }

      // Filter by public status
      if (filters.isPublic !== undefined) {
        snippets = snippets.filter(s => s.isPublic === filters.isPublic);
      }
    }
    
    // Sort by most recently updated
    return snippets.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  }

  async getSnippet(id: number): Promise<Snippet | undefined> {
    return this.snippets.get(id);
  }

  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const id = this.snippetIdCounter++;
    const now = new Date();
    
    const newSnippet: Snippet = {
      ...snippet,
      id,
      createdAt: now,
      updatedAt: now,
      viewCount: snippet.viewCount || 0,
      isFavorite: snippet.isFavorite || false,
      isPublic: snippet.isPublic || false, // Ensure isPublic is set, defaulting to false
      shareId: snippet.shareId || null
    };
    
    this.snippets.set(id, newSnippet);
    return newSnippet;
  }

  async updateSnippet(id: number, snippet: InsertSnippet): Promise<Snippet> {
    const existingSnippet = this.snippets.get(id);
    
    if (!existingSnippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    
    const updatedSnippet: Snippet = {
      ...existingSnippet,
      ...snippet,
      updatedAt: new Date()
    };
    
    this.snippets.set(id, updatedSnippet);
    return updatedSnippet;
  }

  async deleteSnippet(id: number): Promise<void> {
    // Delete snippet from collections first
    const collectionItemsToDelete = Array.from(this.collectionItems.values())
      .filter(item => item.snippetId === id);
    
    for (const item of collectionItemsToDelete) {
      this.collectionItems.delete(item.id);
    }
    
    // Delete the snippet
    this.snippets.delete(id);
  }

  async incrementSnippetViewCount(id: number): Promise<void> {
    const snippet = this.snippets.get(id);
    
    if (snippet) {
      const updatedSnippet = {
        ...snippet,
        viewCount: snippet.viewCount + 1
      };
      
      this.snippets.set(id, updatedSnippet);
    }
  }

  async toggleSnippetFavorite(id: number): Promise<Snippet> {
    const snippet = this.snippets.get(id);
    
    if (!snippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    
    const updatedSnippet = {
      ...snippet,
      isFavorite: !snippet.isFavorite
    };
    
    this.snippets.set(id, updatedSnippet);
    return updatedSnippet;
  }

  // Language and tag operations
  async getLanguages(): Promise<string[]> {
    const languages = new Set<string>();
    
    for (const snippet of this.snippets.values()) {
      languages.add(snippet.language);
    }
    
    return Array.from(languages).sort();
  }

  async getTags(): Promise<string[]> {
    const tags = new Set<string>();
    
    for (const snippet of this.snippets.values()) {
      if (snippet.tags) {
        for (const tag of snippet.tags) {
          tags.add(tag);
        }
      }
    }
    
    return Array.from(tags).sort();
  }

  // Collection operations
  async getCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = this.collectionIdCounter++;
    const now = new Date();
    
    const newCollection: Collection = {
      ...collection,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async updateCollection(id: number, collection: InsertCollection): Promise<Collection> {
    const existingCollection = this.collections.get(id);
    
    if (!existingCollection) {
      throw new Error(`Collection with id ${id} not found`);
    }
    
    const updatedCollection: Collection = {
      ...existingCollection,
      ...collection,
      updatedAt: new Date()
    };
    
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<void> {
    // Delete all collection items first
    const collectionItemsToDelete = Array.from(this.collectionItems.values())
      .filter(item => item.collectionId === id);
    
    for (const item of collectionItemsToDelete) {
      this.collectionItems.delete(item.id);
    }
    
    // Delete the collection
    this.collections.delete(id);
  }

  // Collection items operations
  async getCollectionSnippets(collectionId: number): Promise<Snippet[]> {
    // Find all collection items for this collection
    const items = Array.from(this.collectionItems.values())
      .filter(item => item.collectionId === collectionId);
    
    // Get the snippets for these items
    const snippets: Snippet[] = [];
    
    for (const item of items) {
      const snippet = this.snippets.get(item.snippetId);
      if (snippet) {
        snippets.push(snippet);
      }
    }
    
    return snippets;
  }

  async addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem> {
    // Check if snippet and collection exist
    const snippet = this.snippets.get(collectionItem.snippetId);
    const collection = this.collections.get(collectionItem.collectionId);
    
    if (!snippet) {
      throw new Error(`Snippet with id ${collectionItem.snippetId} not found`);
    }
    
    if (!collection) {
      throw new Error(`Collection with id ${collectionItem.collectionId} not found`);
    }
    
    // Check if snippet is already in collection
    const existingItem = Array.from(this.collectionItems.values()).find(
      item => item.collectionId === collectionItem.collectionId && 
              item.snippetId === collectionItem.snippetId
    );
    
    if (existingItem) {
      return existingItem;
    }
    
    // Add to collection
    const id = this.collectionItemIdCounter++;
    const now = new Date();
    
    const newItem: CollectionItem = {
      ...collectionItem,
      id,
      createdAt: now
    };
    
    this.collectionItems.set(id, newItem);
    return newItem;
  }

  async removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void> {
    // Find the collection item
    const item = Array.from(this.collectionItems.values()).find(
      item => item.collectionId === collectionId && item.snippetId === snippetId
    );
    
    if (item) {
      this.collectionItems.delete(item.id);
    }
  }
}

export class DatabaseStorage implements IStorage {
  // Sharing operations
  async getSnippetByShareId(shareId: string): Promise<Snippet | undefined> {
    const { db } = await import('./db');
    const result = await db.select().from(snippets).where(eq(snippets.shareId, shareId)).limit(1);
    return result[0];
  }

  async generateShareId(snippetId: number): Promise<string> {
    const { db } = await import('./db');
    // Generate a random share ID (8 characters)
    const shareId = Math.random().toString(36).substring(2, 10);
    
    // Update the snippet with the new share ID
    await db
      .update(snippets)
      .set({ shareId })
      .where(eq(snippets.id, snippetId));
    
    return shareId;
  }

  async toggleSnippetPublic(snippetId: number): Promise<Snippet> {
    const { db } = await import('./db');
    // First get the current snippet
    const [currentSnippet] = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, snippetId));
    
    if (!currentSnippet) {
      throw new Error(`Snippet with ID ${snippetId} not found`);
    }
    
    // Toggle the isPublic flag
    const isPublic = !currentSnippet.isPublic;
    
    // If making public and no shareId exists, generate one
    let shareId = currentSnippet.shareId;
    if (isPublic && !shareId) {
      shareId = Math.random().toString(36).substring(2, 10);
    }
    
    // Update the snippet
    const [updatedSnippet] = await db
      .update(snippets)
      .set({ isPublic, shareId })
      .where(eq(snippets.id, snippetId))
      .returning();
    
    return updatedSnippet;
  }
  
  // Comment operations
  async getCommentsBySnippetId(snippetId: number): Promise<Comment[]> {
    const { db } = await import('./db');
    return db
      .select()
      .from(comments)
      .where(eq(comments.snippetId, snippetId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const { db } = await import('./db');
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment> {
    const { db } = await import('./db');
    const [updatedComment] = await db
      .update(comments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    
    if (!updatedComment) {
      throw new Error(`Comment with ID ${id} not found`);
    }
    
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    const { db } = await import('./db');
    await db
      .delete(comments)
      .where(eq(comments.id, id));
  }
  async getUser(id: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { db } = await import('./db');
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async upsertUser(insertUser: InsertUser): Promise<User> {
    const { db } = await import('./db');
    const result = await db
      .insert(users)
      .values(insertUser)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...insertUser,
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  }

  async getSnippets(filters?: {
    search?: string;
    language?: string | string[];
    tag?: string | string[];
    favorites?: boolean;
    isPublic?: boolean;
    userId?: string; // Added userId
  }): Promise<Snippet[]> {
    const { db } = await import('./db');
    let query = db.select().from(snippets);
    const conditions = [];
    
    if (filters) {
      // Handle userId filter
      if (filters.userId) {
        conditions.push(eq(snippets.userId, filters.userId));
      }
      
      // Handle language filter (single string or array)
      // Handle language filter (single string or array)
      if (filters.language) {
        if (Array.isArray(filters.language)) {
          // Multiple languages OR condition
          const languageConditions = filters.language.map(lang => 
            eq(snippets.language, lang)
          );
          if (languageConditions.length > 0) {
            conditions.push(or(...languageConditions));
          }
        } else {
          // Single language
          conditions.push(eq(snippets.language, filters.language));
        }
      }
      
      // Handle search filter
      if (filters.search) {
        conditions.push(
          or(
            ilike(snippets.title, `%${filters.search}%`),
            ilike(snippets.description || '', `%${filters.search}%`),
            ilike(snippets.code, `%${filters.search}%`)
          )
        );
      }
      
      // Handle tag filter (single string or array)
      if (filters.tag) {
        if (Array.isArray(filters.tag)) {
          // Use ANY operator for array of tags
          const tagArray = filters.tag.map(t => t.toString());
          conditions.push(
            sql`${snippets.tags} && ARRAY[${tagArray}]::text[]`
          );
        } else {
          // Single tag using contains operator
          conditions.push(
            sql`${snippets.tags} @> ARRAY[${filters.tag}]::text[]`
          );
        }
      }
      
      // Handle favorites filter
      if (filters.favorites) {
        conditions.push(eq(snippets.isFavorite, true));
      }

      // Filter by public status
      if (filters.isPublic !== undefined) {
        conditions.push(eq(snippets.isPublic, filters.isPublic));
      }
    }
    
    // Apply all conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by most recently updated
    query = query.orderBy(desc(snippets.updatedAt));
    
    return await query;
  }

  async getSnippet(id: number): Promise<Snippet | undefined> {
    const { db } = await import('./db');
    const result = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
    return result[0];
  }

  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const { db } = await import('./db');
    const now = new Date();
    
    // Ensure we only include valid fields from our schema
    const snippetToInsert = {
      title: snippet.title,
      code: snippet.code,
      language: snippet.language,
      description: snippet.description || null,
      tags: snippet.tags || null,
      userId: snippet.userId || null,
      isFavorite: snippet.isFavorite || false,
      // These fields are handled automatically by defaults
      // createdAt and updatedAt are set by defaultNow()
      // viewCount is set by default(0)
    };
    
    const result = await db.insert(snippets).values(snippetToInsert).returning();
    return result[0];
  }

  async updateSnippet(id: number, snippet: InsertSnippet): Promise<Snippet> {
    const { db } = await import('./db');
    const existingSnippet = await this.getSnippet(id);
    
    if (!existingSnippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    
    // Only include fields that can be updated based on our schema
    const updateData = {
      title: snippet.title,
      code: snippet.code,
      language: snippet.language,
      description: snippet.description || null,
      tags: snippet.tags || null,
      userId: snippet.userId || null,
      isFavorite: snippet.isFavorite !== undefined ? snippet.isFavorite : existingSnippet.isFavorite,
      updatedAt: new Date()
    };
    
    const result = await db
      .update(snippets)
      .set(updateData)
      .where(eq(snippets.id, id))
      .returning();
    
    return result[0];
  }

  async deleteSnippet(id: number): Promise<void> {
    const { db } = await import('./db');
    const existingSnippet = await this.getSnippet(id);
    
    if (!existingSnippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    
    // First delete all collection items that reference this snippet
    await db
      .delete(collectionItems)
      .where(eq(collectionItems.snippetId, id));
    
    // Then delete the snippet
    await db
      .delete(snippets)
      .where(eq(snippets.id, id));
  }

  async incrementSnippetViewCount(id: number): Promise<void> {
    const { db } = await import('./db');
    const existingSnippet = await this.getSnippet(id);
    
    if (!existingSnippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    
    await db
      .update(snippets)
      .set({
        viewCount: sql`${snippets.viewCount} + 1`
      })
      .where(eq(snippets.id, id));
  }

  async toggleSnippetFavorite(id: number): Promise<Snippet> {
    const { db } = await import('./db');
    const existingSnippet = await this.getSnippet(id);
    
    if (!existingSnippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }
    
    const result = await db
      .update(snippets)
      .set({
        isFavorite: !existingSnippet.isFavorite
      })
      .where(eq(snippets.id, id))
      .returning();
    
    return result[0];
  }

  async getLanguages(): Promise<string[]> {
    const { db } = await import('./db');
    const result = await db
      .selectDistinct({ language: snippets.language })
      .from(snippets);
    
    return result.map(r => r.language);
  }

  async getTags(): Promise<string[]> {
    const { db } = await import('./db');
    // Extract unique tags from the tags array column
    const allTags = await db
      .select({ tags: snippets.tags })
      .from(snippets)
      .where(isNotNull(snippets.tags));
    
    // Flatten and get unique tags
    const uniqueTags = new Set<string>();
    allTags.forEach(row => {
      if (row.tags) {
        row.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    
    return Array.from(uniqueTags);
  }

  async getCollections(): Promise<Collection[]> {
    const { db } = await import('./db');
    return await db.select().from(collections);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const { db } = await import('./db');
    const result = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
    return result[0];
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const { db } = await import('./db');
    const now = new Date();
    const collectionWithDefaults = {
      ...collection,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await db.insert(collections).values(collectionWithDefaults).returning();
    return result[0];
  }

  async updateCollection(id: number, collection: InsertCollection): Promise<Collection> {
    const { db } = await import('./db');
    const existingCollection = await this.getCollection(id);
    
    if (!existingCollection) {
      throw new Error(`Collection with id ${id} not found`);
    }
    
    const result = await db
      .update(collections)
      .set({
        ...collection,
        updatedAt: new Date()
      })
      .where(eq(collections.id, id))
      .returning();
    
    return result[0];
  }

  async deleteCollection(id: number): Promise<void> {
    const { db } = await import('./db');
    const existingCollection = await this.getCollection(id);
    
    if (!existingCollection) {
      throw new Error(`Collection with id ${id} not found`);
    }
    
    // First delete all collection items that reference this collection
    await db
      .delete(collectionItems)
      .where(eq(collectionItems.collectionId, id));
    
    // Then delete the collection
    await db
      .delete(collections)
      .where(eq(collections.id, id));
  }

  async getCollectionSnippets(collectionId: number): Promise<Snippet[]> {
    const { db } = await import('./db');
    const existingCollection = await this.getCollection(collectionId);
    
    if (!existingCollection) {
      throw new Error(`Collection with id ${collectionId} not found`);
    }
    
    const result = await db
      .select()
      .from(snippets)
      .innerJoin(collectionItems, eq(snippets.id, collectionItems.snippetId))
      .where(eq(collectionItems.collectionId, collectionId));
    
    return result.map(row => ({
      ...row.snippets
    }));
  }

  async addSnippetToCollection(collectionItem: InsertCollectionItem): Promise<CollectionItem> {
    const { db } = await import('./db');
    
    // Check if collection exists
    const existingCollection = await this.getCollection(collectionItem.collectionId);
    if (!existingCollection) {
      throw new Error(`Collection with id ${collectionItem.collectionId} not found`);
    }
    
    // Check if snippet exists
    const existingSnippet = await this.getSnippet(collectionItem.snippetId);
    if (!existingSnippet) {
      throw new Error(`Snippet with id ${collectionItem.snippetId} not found`);
    }
    
    // Check if the snippet is already in the collection
    const existing = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionItem.collectionId),
          eq(collectionItems.snippetId, collectionItem.snippetId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      throw new Error(`Snippet is already in the collection`);
    }
    
    const now = new Date();
    const itemWithDefaults = {
      ...collectionItem,
      createdAt: now
    };
    
    const result = await db
      .insert(collectionItems)
      .values(itemWithDefaults)
      .returning();
    
    return result[0];
  }

  async removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void> {
    const { db } = await import('./db');
    
    // Check if the item exists
    const existing = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.snippetId, snippetId)
        )
      )
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error(`Snippet is not in the collection`);
    }
    
    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.snippetId, snippetId)
        )
      );
  }
}

// Create an instance of DatabaseStorage to use throughout the application
// Using in-memory storage for now until database issues are resolved
// Switch to database storage for persistent data
export const storage = new DatabaseStorage();
