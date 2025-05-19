var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { users, snippets, collections, collectionItems, comments } from "@shared/schema";
import { eq, and, or, isNotNull, ilike, sql, desc, asc } from "drizzle-orm";
var MemStorage = /** @class */ (function () {
    function MemStorage() {
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
    MemStorage.prototype.initializeSampleData = function () {
        var _this = this;
        // Add sample snippets
        var sampleSnippets = [
            {
                title: "React useLocalStorage Hook",
                description: "Custom React hook to persist state in localStorage with type safety.",
                code: "import { useState, useEffect } from 'react';\n\nfunction useLocalStorage<T>(\n  key: string, \n  initialValue: T\n): [T, (value: T) => void] {\n  // Get stored value\n  const readValue = (): T => {\n    if (typeof window === 'undefined') {\n      return initialValue;\n    }\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      console.warn('Error reading localStorage key', error);\n      return initialValue;\n    }\n  };\n  \n  const [storedValue, setStoredValue] = useState<T>(readValue);\n  \n  // Return a wrapped version of useState's setter\n  const setValue = (value: T) => {\n    try {\n      // Save state\n      setStoredValue(value);\n      // Save to localStorage\n      window.localStorage.setItem(key, JSON.stringify(value));\n    } catch (error) {\n      console.warn('Error setting localStorage key', error);\n    }\n  };\n\n  useEffect(() => {\n    setStoredValue(readValue());\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  return [storedValue, setValue];\n}",
                language: "tsx",
                tags: ["react", "hooks", "typescript"],
                userId: null,
                isFavorite: false,
                viewCount: 12
            },
            {
                title: "Python Decorator for Timing",
                description: "A simple Python decorator to measure and log function execution time.",
                code: "import time\nimport functools\nimport logging\n\ndef timer(func):\n    \"\"\"Print the runtime of the decorated function\"\"\"\n    @functools.wraps(func)\n    def wrapper_timer(*args, **kwargs):\n        start_time = time.perf_counter()\n        value = func(*args, **kwargs)\n        end_time = time.perf_counter()\n        run_time = end_time - start_time\n        logging.info(f\"Completed {func.__name__!r} in {run_time:.4f} secs\")\n        return value\n    return wrapper_timer\n\n# Example usage\n@timer\ndef waste_some_time(num_times):\n    for _ in range(num_times):\n        sum([i**2 for i in range(10000)])\n        \n# Call it\nwaste_some_time(100)",
                language: "python",
                tags: ["python", "decorators", "performance"],
                userId: null,
                isFavorite: false,
                viewCount: 24
            },
            {
                title: "CSS Grid Layout Template",
                description: "Responsive grid layout with areas for header, sidebar, content and footer.",
                code: ".grid-container {\n  display: grid;\n  grid-template-columns: repeat(12, 1fr);\n  grid-template-rows: auto 1fr auto;\n  grid-template-areas:\n    \"h h h h h h h h h h h h\"\n    \"s s c c c c c c c c c c\"\n    \"f f f f f f f f f f f f\";\n  min-height: 100vh;\n  gap: 1rem;\n}\n\n.header { grid-area: h; }\n.sidebar { grid-area: s; }\n.content { grid-area: c; }\n.footer { grid-area: f; }\n\n/* Tablet layout */\n@media (max-width: 992px) {\n  .grid-container {\n    grid-template-areas:\n      \"h h h h h h h h h h h h\"\n      \"s s s s c c c c c c c c\"\n      \"f f f f f f f f f f f f\";\n  }\n}\n\n/* Mobile layout */\n@media (max-width: 768px) {\n  .grid-container {\n    grid-template-areas:\n      \"h h h h h h h h h h h h\"\n      \"c c c c c c c c c c c c\"\n      \"s s s s s s s s s s s s\"\n      \"f f f f f f f f f f f f\";\n  }\n}",
                language: "css",
                tags: ["css", "grid", "responsive"],
                userId: null,
                isFavorite: true,
                viewCount: 41
            },
            {
                title: "JavaScript Array Methods Cheatsheet",
                description: "Quick reference for common JavaScript array methods with examples.",
                code: "/* Array methods cheatsheet */\n\n// ADDING ELEMENTS\narray.push(item);          // Add to end\narray.unshift(item);       // Add to beginning\narray.splice(index, 0, item); // Add at position\n\n// REMOVING ELEMENTS\narray.pop();               // Remove from end\narray.shift();             // Remove from beginning\narray.splice(index, 1);    // Remove at position\n\n// TRANSFORMATION\narray.map(callback);       // Create new array with results\narray.filter(callback);    // Create array with elements that pass test\narray.reduce(callback, initialValue); // Reduce to single value\narray.sort(compareFunction); // Sort elements\narray.reverse();           // Reverse order\n\n// SEARCHING\narray.find(callback);      // Find first matching element\narray.findIndex(callback); // Find index of first match\narray.includes(item);      // Check if array contains item\narray.indexOf(item);       // Find index of item (-1 if not found)\n\n// ITERATION\narray.forEach(callback);   // Execute function on each element\n\n// JOINING & SPLITTING\narray.join(separator);     // Join elements into string\nstring.split(separator);   // Split string into array",
                language: "javascript",
                tags: ["javascript", "arrays", "cheatsheet"],
                userId: null,
                isFavorite: true,
                viewCount: 137
            },
            {
                title: "Tailwind Dark Mode Toggle",
                description: "React component for toggling dark mode with system preference detection.",
                code: "import { useState, useEffect } from 'react';\n\nconst DarkModeToggle = () => {\n  const [darkMode, setDarkMode] = useState(false);\n\n  useEffect(() => {\n    // Check for system preference when component mounts\n    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;\n    setDarkMode(\n      localStorage.getItem('darkMode') !== null\n        ? localStorage.getItem('darkMode') === 'true'\n        : prefersDark\n    );\n  }, []);\n\n  useEffect(() => {\n    // Update document class when darkMode state changes\n    if (darkMode) {\n      document.documentElement.classList.add('dark');\n      localStorage.setItem('darkMode', 'true');\n    } else {\n      document.documentElement.classList.remove('dark');\n      localStorage.setItem('darkMode', 'false');\n    }\n  }, [darkMode]);\n\n  return (\n    <button\n      onClick={() => setDarkMode(!darkMode)}\n      className=\"p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700\"\n      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}\n    >\n      {darkMode ? (\n        <SunIcon className=\"h-5 w-5\" />\n      ) : (\n        <MoonIcon className=\"h-5 w-5\" />\n      )}\n    </button>\n  );\n};",
                language: "jsx",
                tags: ["react", "tailwind", "darkmode"],
                userId: null,
                isFavorite: false,
                viewCount: 52
            },
            {
                title: "Go Error Handling Pattern",
                description: "Best practices for handling errors in Go with custom error types.",
                code: "package main\n\nimport (\n        \"errors\"\n        \"fmt\"\n)\n\n// Define custom error types\ntype NotFoundError struct {\n        ID string\n}\n\nfunc (e *NotFoundError) Error() string {\n        return fmt.Sprintf(\"entity with ID %s not found\", e.ID)\n}\n\n// Function that returns different error types\nfunc GetUser(id string) (User, error) {\n        // Simulate user not found\n        if id == \"\" {\n                return User{}, &NotFoundError{ID: id}\n        }\n        \n        // Simulate another error\n        if id == \"invalid\" {\n                return User{}, errors.New(\"invalid user ID format\")\n        }\n        \n        // Success\n        return User{ID: id, Name: \"John Doe\"}, nil\n}\n\n// Error handling pattern with type checking\nfunc main() {\n        user, err := GetUser(\"\")\n        if err != nil {\n                // Check specific error type\n                if notFoundErr, ok := err.(*NotFoundError); ok {\n                        fmt.Printf(\"Could not find user: %v\\n\", notFoundErr)\n                        // Handle not found case\n                } else {\n                        fmt.Printf(\"Error getting user: %v\\n\", err)\n                        // Handle other errors\n                }\n                return\n        }\n        \n        // Process the user\n        fmt.Printf(\"Found user: %s\\n\", user.Name)\n}",
                language: "go",
                tags: ["go", "error-handling", "best-practices"],
                userId: null,
                isFavorite: false,
                viewCount: 18
            }
        ];
        // Add sample collections
        var sampleCollections = [
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
        sampleSnippets.forEach(function (snippet) {
            _this.createSnippet(__assign(__assign({}, snippet), { viewCount: snippet.viewCount || 0, isFavorite: snippet.isFavorite || false }));
        });
        // Add all sample collections
        var collectionIds = sampleCollections.map(function (collection) {
            return _this.createCollection(collection).then(function (c) { return c.id; });
        });
        // Once all collections are created, add snippets to them
        Promise.all(collectionIds).then(function (ids) {
            // Add React useLocalStorage and Tailwind Dark Mode Toggle to React Patterns
            _this.addSnippetToCollection({ collectionId: ids[0], snippetId: 1 });
            _this.addSnippetToCollection({ collectionId: ids[0], snippetId: 5 });
            // Add CSS Grid Layout to CSS Layouts
            _this.addSnippetToCollection({ collectionId: ids[1], snippetId: 3 });
            // Add JavaScript Array Methods to JavaScript Essentials
            _this.addSnippetToCollection({ collectionId: ids[2], snippetId: 4 });
        });
    };
    // User operations
    MemStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.get(id)];
            });
        });
    };
    MemStorage.prototype.getUserByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.username === username; })];
            });
        });
    };
    MemStorage.prototype.createUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var id, user;
            return __generator(this, function (_a) {
                id = this.userIdCounter++;
                user = __assign(__assign({}, insertUser), { id: id });
                this.users.set(id, user);
                return [2 /*return*/, user];
            });
        });
    };
    // Snippet operations
    MemStorage.prototype.getSnippets = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var snippets, languages_1, langLower_1, tags_1, tagLower_1, searchTerm_1;
            return __generator(this, function (_a) {
                snippets = Array.from(this.snippets.values());
                if (filters) {
                    // Filter by language - support both single language and multiple languages
                    if (filters.language) {
                        if (Array.isArray(filters.language)) {
                            languages_1 = filters.language.map(function (lang) { return lang.toLowerCase(); });
                            snippets = snippets.filter(function (s) {
                                return s.language && languages_1.includes(s.language.toLowerCase());
                            });
                        }
                        else {
                            langLower_1 = filters.language.toLowerCase();
                            snippets = snippets.filter(function (s) {
                                return s.language && s.language.toLowerCase() === langLower_1;
                            });
                        }
                    }
                    // Filter by tag - support both single tag and multiple tags
                    if (filters.tag) {
                        if (Array.isArray(filters.tag)) {
                            tags_1 = filters.tag.map(function (tag) { return tag.toLowerCase(); });
                            snippets = snippets.filter(function (s) { var _a; return (_a = s.tags) === null || _a === void 0 ? void 0 : _a.some(function (tag) { return tags_1.includes(tag.toLowerCase()); }); });
                        }
                        else {
                            tagLower_1 = filters.tag.toLowerCase();
                            snippets = snippets.filter(function (s) { var _a; return (_a = s.tags) === null || _a === void 0 ? void 0 : _a.some(function (tag) { return tag.toLowerCase() === tagLower_1; }); });
                        }
                    }
                    // Filter by favorites
                    if (filters.favorites) {
                        snippets = snippets.filter(function (s) { return s.isFavorite; });
                    }
                    // Filter by search term (title, description, code)
                    if (filters.search) {
                        searchTerm_1 = filters.search.toLowerCase();
                        snippets = snippets.filter(function (s) {
                            return s.title.toLowerCase().includes(searchTerm_1) ||
                                (s.description && s.description.toLowerCase().includes(searchTerm_1)) ||
                                (s.code && s.code.toLowerCase().includes(searchTerm_1));
                        });
                    }
                }
                // Sort by most recently updated
                return [2 /*return*/, snippets.sort(function (a, b) {
                        var dateA = new Date(a.updatedAt).getTime();
                        var dateB = new Date(b.updatedAt).getTime();
                        return dateB - dateA;
                    })];
            });
        });
    };
    MemStorage.prototype.getSnippet = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.snippets.get(id)];
            });
        });
    };
    MemStorage.prototype.createSnippet = function (snippet) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, newSnippet;
            return __generator(this, function (_a) {
                id = this.snippetIdCounter++;
                now = new Date();
                newSnippet = __assign(__assign({}, snippet), { id: id, createdAt: now, updatedAt: now, viewCount: snippet.viewCount || 0, isFavorite: snippet.isFavorite || false });
                this.snippets.set(id, newSnippet);
                return [2 /*return*/, newSnippet];
            });
        });
    };
    MemStorage.prototype.updateSnippet = function (id, snippet) {
        return __awaiter(this, void 0, void 0, function () {
            var existingSnippet, updatedSnippet;
            return __generator(this, function (_a) {
                existingSnippet = this.snippets.get(id);
                if (!existingSnippet) {
                    throw new Error("Snippet with id ".concat(id, " not found"));
                }
                updatedSnippet = __assign(__assign(__assign({}, existingSnippet), snippet), { updatedAt: new Date() });
                this.snippets.set(id, updatedSnippet);
                return [2 /*return*/, updatedSnippet];
            });
        });
    };
    MemStorage.prototype.deleteSnippet = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionItemsToDelete, _i, collectionItemsToDelete_1, item;
            return __generator(this, function (_a) {
                collectionItemsToDelete = Array.from(this.collectionItems.values())
                    .filter(function (item) { return item.snippetId === id; });
                for (_i = 0, collectionItemsToDelete_1 = collectionItemsToDelete; _i < collectionItemsToDelete_1.length; _i++) {
                    item = collectionItemsToDelete_1[_i];
                    this.collectionItems.delete(item.id);
                }
                // Delete the snippet
                this.snippets.delete(id);
                return [2 /*return*/];
            });
        });
    };
    MemStorage.prototype.incrementSnippetViewCount = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var snippet, updatedSnippet;
            return __generator(this, function (_a) {
                snippet = this.snippets.get(id);
                if (snippet) {
                    updatedSnippet = __assign(__assign({}, snippet), { viewCount: snippet.viewCount + 1 });
                    this.snippets.set(id, updatedSnippet);
                }
                return [2 /*return*/];
            });
        });
    };
    MemStorage.prototype.toggleSnippetFavorite = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var snippet, updatedSnippet;
            return __generator(this, function (_a) {
                snippet = this.snippets.get(id);
                if (!snippet) {
                    throw new Error("Snippet with id ".concat(id, " not found"));
                }
                updatedSnippet = __assign(__assign({}, snippet), { isFavorite: !snippet.isFavorite });
                this.snippets.set(id, updatedSnippet);
                return [2 /*return*/, updatedSnippet];
            });
        });
    };
    // Language and tag operations
    MemStorage.prototype.getLanguages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var languages, _i, _a, snippet;
            return __generator(this, function (_b) {
                languages = new Set();
                for (_i = 0, _a = this.snippets.values(); _i < _a.length; _i++) {
                    snippet = _a[_i];
                    languages.add(snippet.language);
                }
                return [2 /*return*/, Array.from(languages).sort()];
            });
        });
    };
    MemStorage.prototype.getTags = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tags, _i, _a, snippet, _b, _c, tag;
            return __generator(this, function (_d) {
                tags = new Set();
                for (_i = 0, _a = this.snippets.values(); _i < _a.length; _i++) {
                    snippet = _a[_i];
                    if (snippet.tags) {
                        for (_b = 0, _c = snippet.tags; _b < _c.length; _b++) {
                            tag = _c[_b];
                            tags.add(tag);
                        }
                    }
                }
                return [2 /*return*/, Array.from(tags).sort()];
            });
        });
    };
    // Collection operations
    MemStorage.prototype.getCollections = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.collections.values())];
            });
        });
    };
    MemStorage.prototype.getCollection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.collections.get(id)];
            });
        });
    };
    MemStorage.prototype.createCollection = function (collection) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, newCollection;
            return __generator(this, function (_a) {
                id = this.collectionIdCounter++;
                now = new Date();
                newCollection = __assign(__assign({}, collection), { id: id, createdAt: now, updatedAt: now });
                this.collections.set(id, newCollection);
                return [2 /*return*/, newCollection];
            });
        });
    };
    MemStorage.prototype.updateCollection = function (id, collection) {
        return __awaiter(this, void 0, void 0, function () {
            var existingCollection, updatedCollection;
            return __generator(this, function (_a) {
                existingCollection = this.collections.get(id);
                if (!existingCollection) {
                    throw new Error("Collection with id ".concat(id, " not found"));
                }
                updatedCollection = __assign(__assign(__assign({}, existingCollection), collection), { updatedAt: new Date() });
                this.collections.set(id, updatedCollection);
                return [2 /*return*/, updatedCollection];
            });
        });
    };
    MemStorage.prototype.deleteCollection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionItemsToDelete, _i, collectionItemsToDelete_2, item;
            return __generator(this, function (_a) {
                collectionItemsToDelete = Array.from(this.collectionItems.values())
                    .filter(function (item) { return item.collectionId === id; });
                for (_i = 0, collectionItemsToDelete_2 = collectionItemsToDelete; _i < collectionItemsToDelete_2.length; _i++) {
                    item = collectionItemsToDelete_2[_i];
                    this.collectionItems.delete(item.id);
                }
                // Delete the collection
                this.collections.delete(id);
                return [2 /*return*/];
            });
        });
    };
    // Collection items operations
    MemStorage.prototype.getCollectionSnippets = function (collectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var items, snippets, _i, items_1, item, snippet;
            return __generator(this, function (_a) {
                items = Array.from(this.collectionItems.values())
                    .filter(function (item) { return item.collectionId === collectionId; });
                snippets = [];
                for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                    item = items_1[_i];
                    snippet = this.snippets.get(item.snippetId);
                    if (snippet) {
                        snippets.push(snippet);
                    }
                }
                return [2 /*return*/, snippets];
            });
        });
    };
    MemStorage.prototype.addSnippetToCollection = function (collectionItem) {
        return __awaiter(this, void 0, void 0, function () {
            var snippet, collection, existingItem, id, now, newItem;
            return __generator(this, function (_a) {
                snippet = this.snippets.get(collectionItem.snippetId);
                collection = this.collections.get(collectionItem.collectionId);
                if (!snippet) {
                    throw new Error("Snippet with id ".concat(collectionItem.snippetId, " not found"));
                }
                if (!collection) {
                    throw new Error("Collection with id ".concat(collectionItem.collectionId, " not found"));
                }
                existingItem = Array.from(this.collectionItems.values()).find(function (item) { return item.collectionId === collectionItem.collectionId &&
                    item.snippetId === collectionItem.snippetId; });
                if (existingItem) {
                    return [2 /*return*/, existingItem];
                }
                id = this.collectionItemIdCounter++;
                now = new Date();
                newItem = __assign(__assign({}, collectionItem), { id: id, createdAt: now });
                this.collectionItems.set(id, newItem);
                return [2 /*return*/, newItem];
            });
        });
    };
    MemStorage.prototype.removeSnippetFromCollection = function (collectionId, snippetId) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                item = Array.from(this.collectionItems.values()).find(function (item) { return item.collectionId === collectionId && item.snippetId === snippetId; });
                if (item) {
                    this.collectionItems.delete(item.id);
                }
                return [2 /*return*/];
            });
        });
    };
    return MemStorage;
}());
export { MemStorage };
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
    }
    // Sharing operations
    DatabaseStorage.prototype.getSnippetByShareId = function (shareId) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.select().from(snippets).where(eq(snippets.shareId, shareId)).limit(1)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.generateShareId = function (snippetId) {
        return __awaiter(this, void 0, void 0, function () {
            var db, shareId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        shareId = Math.random().toString(36).substring(2, 10);
                        // Update the snippet with the new share ID
                        return [4 /*yield*/, db
                                .update(snippets)
                                .set({ shareId: shareId })
                                .where(eq(snippets.id, snippetId))];
                    case 2:
                        // Update the snippet with the new share ID
                        _a.sent();
                        return [2 /*return*/, shareId];
                }
            });
        });
    };
    DatabaseStorage.prototype.toggleSnippetPublic = function (snippetId) {
        return __awaiter(this, void 0, void 0, function () {
            var db, currentSnippet, isPublic, shareId, updatedSnippet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .select()
                                .from(snippets)
                                .where(eq(snippets.id, snippetId))];
                    case 2:
                        currentSnippet = (_a.sent())[0];
                        if (!currentSnippet) {
                            throw new Error("Snippet with ID ".concat(snippetId, " not found"));
                        }
                        isPublic = !currentSnippet.isPublic;
                        shareId = currentSnippet.shareId;
                        if (isPublic && !shareId) {
                            shareId = Math.random().toString(36).substring(2, 10);
                        }
                        return [4 /*yield*/, db
                                .update(snippets)
                                .set({ isPublic: isPublic, shareId: shareId })
                                .where(eq(snippets.id, snippetId))
                                .returning()];
                    case 3:
                        updatedSnippet = (_a.sent())[0];
                        return [2 /*return*/, updatedSnippet];
                }
            });
        });
    };
    // Comment operations
    DatabaseStorage.prototype.getCommentsBySnippetId = function (snippetId) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [2 /*return*/, db
                                .select()
                                .from(comments)
                                .where(eq(comments.snippetId, snippetId))
                                .orderBy(asc(comments.createdAt))];
                }
            });
        });
    };
    DatabaseStorage.prototype.createComment = function (comment) {
        return __awaiter(this, void 0, void 0, function () {
            var db, newComment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .insert(comments)
                                .values(comment)
                                .returning()];
                    case 2:
                        newComment = (_a.sent())[0];
                        return [2 /*return*/, newComment];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateComment = function (id, comment) {
        return __awaiter(this, void 0, void 0, function () {
            var db, updatedComment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .update(comments)
                                .set(__assign(__assign({}, comment), { updatedAt: new Date() }))
                                .where(eq(comments.id, id))
                                .returning()];
                    case 2:
                        updatedComment = (_a.sent())[0];
                        if (!updatedComment) {
                            throw new Error("Comment with ID ".concat(id, " not found"));
                        }
                        return [2 /*return*/, updatedComment];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteComment = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .delete(comments)
                                .where(eq(comments.id, id))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.select().from(users).where(eq(users.id, id)).limit(1)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.select().from(users).where(eq(users.email, email)).limit(1)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.insert(users).values(insertUser).returning()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.upsertUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .insert(users)
                                .values(insertUser)
                                .onConflictDoUpdate({
                                target: users.id,
                                set: __assign(__assign({}, insertUser), { updatedAt: new Date() })
                            })
                                .returning()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSnippets = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var db, query, languageConditions, tagArray;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        query = db.select().from(snippets);
                        if (filters) {
                            // Handle language filter (single string or array)
                            if (filters.language) {
                                if (Array.isArray(filters.language)) {
                                    languageConditions = filters.language.map(function (lang) {
                                        return eq(snippets.language, lang);
                                    });
                                    if (languageConditions.length > 0) {
                                        query = query.where(or.apply(void 0, languageConditions));
                                    }
                                }
                                else {
                                    // Single language
                                    query = query.where(eq(snippets.language, filters.language));
                                }
                            }
                            // Handle search filter
                            if (filters.search) {
                                query = query.where(or(ilike(snippets.title, "%".concat(filters.search, "%")), ilike(snippets.description || '', "%".concat(filters.search, "%")), ilike(snippets.code, "%".concat(filters.search, "%"))));
                            }
                            // Handle tag filter (single string or array)
                            if (filters.tag) {
                                if (Array.isArray(filters.tag)) {
                                    tagArray = filters.tag.map(function (t) { return t.toString(); });
                                    query = query.where(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " && ARRAY[", "]::text[]"], ["", " && ARRAY[", "]::text[]"])), snippets.tags, tagArray));
                                }
                                else {
                                    // Single tag using contains operator
                                    query = query.where(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " @> ARRAY[", "]::text[]"], ["", " @> ARRAY[", "]::text[]"])), snippets.tags, filters.tag));
                                }
                            }
                            // Handle favorites filter
                            if (filters.favorites) {
                                query = query.where(eq(snippets.isFavorite, true));
                            }
                        }
                        // Order by most recently updated
                        query = query.orderBy(desc(snippets.updatedAt));
                        return [4 /*yield*/, query];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSnippet = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.select().from(snippets).where(eq(snippets.id, id)).limit(1)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createSnippet = function (snippet) {
        return __awaiter(this, void 0, void 0, function () {
            var db, now, snippetToInsert, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        now = new Date();
                        snippetToInsert = {
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
                        return [4 /*yield*/, db.insert(snippets).values(snippetToInsert).returning()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateSnippet = function (id, snippet) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingSnippet, updateData, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getSnippet(id)];
                    case 2:
                        existingSnippet = _a.sent();
                        if (!existingSnippet) {
                            throw new Error("Snippet with id ".concat(id, " not found"));
                        }
                        updateData = {
                            title: snippet.title,
                            code: snippet.code,
                            language: snippet.language,
                            description: snippet.description || null,
                            tags: snippet.tags || null,
                            userId: snippet.userId || null,
                            isFavorite: snippet.isFavorite !== undefined ? snippet.isFavorite : existingSnippet.isFavorite,
                            updatedAt: new Date()
                        };
                        return [4 /*yield*/, db
                                .update(snippets)
                                .set(updateData)
                                .where(eq(snippets.id, id))
                                .returning()];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteSnippet = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingSnippet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getSnippet(id)];
                    case 2:
                        existingSnippet = _a.sent();
                        if (!existingSnippet) {
                            throw new Error("Snippet with id ".concat(id, " not found"));
                        }
                        // First delete all collection items that reference this snippet
                        return [4 /*yield*/, db
                                .delete(collectionItems)
                                .where(eq(collectionItems.snippetId, id))];
                    case 3:
                        // First delete all collection items that reference this snippet
                        _a.sent();
                        // Then delete the snippet
                        return [4 /*yield*/, db
                                .delete(snippets)
                                .where(eq(snippets.id, id))];
                    case 4:
                        // Then delete the snippet
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.incrementSnippetViewCount = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingSnippet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getSnippet(id)];
                    case 2:
                        existingSnippet = _a.sent();
                        if (!existingSnippet) {
                            throw new Error("Snippet with id ".concat(id, " not found"));
                        }
                        return [4 /*yield*/, db
                                .update(snippets)
                                .set({
                                viewCount: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), snippets.viewCount)
                            })
                                .where(eq(snippets.id, id))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.toggleSnippetFavorite = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingSnippet, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getSnippet(id)];
                    case 2:
                        existingSnippet = _a.sent();
                        if (!existingSnippet) {
                            throw new Error("Snippet with id ".concat(id, " not found"));
                        }
                        return [4 /*yield*/, db
                                .update(snippets)
                                .set({
                                isFavorite: !existingSnippet.isFavorite
                            })
                                .where(eq(snippets.id, id))
                                .returning()];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getLanguages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .selectDistinct({ language: snippets.language })
                                .from(snippets)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.map(function (r) { return r.language; })];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTags = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, allTags, uniqueTags;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .select({ tags: snippets.tags })
                                .from(snippets)
                                .where(isNotNull(snippets.tags))];
                    case 2:
                        allTags = _a.sent();
                        uniqueTags = new Set();
                        allTags.forEach(function (row) {
                            if (row.tags) {
                                row.tags.forEach(function (tag) { return uniqueTags.add(tag); });
                            }
                        });
                        return [2 /*return*/, Array.from(uniqueTags)];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCollections = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.select().from(collections)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCollection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db.select().from(collections).where(eq(collections.id, id)).limit(1)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createCollection = function (collection) {
        return __awaiter(this, void 0, void 0, function () {
            var db, now, collectionWithDefaults, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        now = new Date();
                        collectionWithDefaults = __assign(__assign({}, collection), { createdAt: now, updatedAt: now });
                        return [4 /*yield*/, db.insert(collections).values(collectionWithDefaults).returning()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateCollection = function (id, collection) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingCollection, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getCollection(id)];
                    case 2:
                        existingCollection = _a.sent();
                        if (!existingCollection) {
                            throw new Error("Collection with id ".concat(id, " not found"));
                        }
                        return [4 /*yield*/, db
                                .update(collections)
                                .set(__assign(__assign({}, collection), { updatedAt: new Date() }))
                                .where(eq(collections.id, id))
                                .returning()];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteCollection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingCollection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getCollection(id)];
                    case 2:
                        existingCollection = _a.sent();
                        if (!existingCollection) {
                            throw new Error("Collection with id ".concat(id, " not found"));
                        }
                        // First delete all collection items that reference this collection
                        return [4 /*yield*/, db
                                .delete(collectionItems)
                                .where(eq(collectionItems.collectionId, id))];
                    case 3:
                        // First delete all collection items that reference this collection
                        _a.sent();
                        // Then delete the collection
                        return [4 /*yield*/, db
                                .delete(collections)
                                .where(eq(collections.id, id))];
                    case 4:
                        // Then delete the collection
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getCollectionSnippets = function (collectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingCollection, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getCollection(collectionId)];
                    case 2:
                        existingCollection = _a.sent();
                        if (!existingCollection) {
                            throw new Error("Collection with id ".concat(collectionId, " not found"));
                        }
                        return [4 /*yield*/, db
                                .select()
                                .from(snippets)
                                .innerJoin(collectionItems, eq(snippets.id, collectionItems.snippetId))
                                .where(eq(collectionItems.collectionId, collectionId))];
                    case 3:
                        result = _a.sent();
                        return [2 /*return*/, result.map(function (row) { return (__assign({}, row.snippets)); })];
                }
            });
        });
    };
    DatabaseStorage.prototype.addSnippetToCollection = function (collectionItem) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existingCollection, existingSnippet, existing, now, itemWithDefaults, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, this.getCollection(collectionItem.collectionId)];
                    case 2:
                        existingCollection = _a.sent();
                        if (!existingCollection) {
                            throw new Error("Collection with id ".concat(collectionItem.collectionId, " not found"));
                        }
                        return [4 /*yield*/, this.getSnippet(collectionItem.snippetId)];
                    case 3:
                        existingSnippet = _a.sent();
                        if (!existingSnippet) {
                            throw new Error("Snippet with id ".concat(collectionItem.snippetId, " not found"));
                        }
                        return [4 /*yield*/, db
                                .select()
                                .from(collectionItems)
                                .where(and(eq(collectionItems.collectionId, collectionItem.collectionId), eq(collectionItems.snippetId, collectionItem.snippetId)))
                                .limit(1)];
                    case 4:
                        existing = _a.sent();
                        if (existing.length > 0) {
                            throw new Error("Snippet is already in the collection");
                        }
                        now = new Date();
                        itemWithDefaults = __assign(__assign({}, collectionItem), { createdAt: now });
                        return [4 /*yield*/, db
                                .insert(collectionItems)
                                .values(itemWithDefaults)
                                .returning()];
                    case 5:
                        result = _a.sent();
                        return [2 /*return*/, result[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.removeSnippetFromCollection = function (collectionId, snippetId) {
        return __awaiter(this, void 0, void 0, function () {
            var db, existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import('./db')];
                    case 1:
                        db = (_a.sent()).db;
                        return [4 /*yield*/, db
                                .select()
                                .from(collectionItems)
                                .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.snippetId, snippetId)))
                                .limit(1)];
                    case 2:
                        existing = _a.sent();
                        if (existing.length === 0) {
                            throw new Error("Snippet is not in the collection");
                        }
                        return [4 /*yield*/, db
                                .delete(collectionItems)
                                .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.snippetId, snippetId)))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseStorage;
}());
export { DatabaseStorage };
// Create an instance of DatabaseStorage to use throughout the application
// Using in-memory storage for now until database issues are resolved
// Switch to database storage for persistent data
export var storage = new DatabaseStorage();
var templateObject_1, templateObject_2, templateObject_3;
