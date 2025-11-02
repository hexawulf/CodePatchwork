# Client (Frontend) - AGENTS.md

## Package Identity

**What**: React 18 frontend for CodePatchwork (visual code snippet manager)  
**Tech**: TypeScript + Vite + TailwindCSS + Shadcn UI + TanStack Query + Wouter

---

## Setup & Run

```bash
# Install dependencies (from project root)
npm install

# Start dev server (runs both client and server)
npm run dev
# Client served by Vite dev server (usually http://localhost:5173)

# Build client only
npm run build
# Output: dist/public/

# Typecheck client + server
npm run check
```

---

## Patterns & Conventions

### File Organization

```
client/src/
├── components/       # UI components
│   ├── ui/          # Shadcn UI primitives (Button, Dialog, etc.)
│   ├── *Dialog.tsx  # Modal/dialog components
│   ├── *Card.tsx    # Card-based display components
│   └── *.tsx        # Feature components
├── pages/           # Route pages (Home, Snippets, Collections, Settings)
├── hooks/           # Custom React hooks (useSnippets, useAuthenticatedFetch, use-toast)
├── contexts/        # React Context providers (AuthContext, ThemeContext, etc.)
├── lib/             # Utilities and configuration
│   ├── firebase.ts  # Firebase client SDK
│   ├── queryClient.ts # TanStack Query config + apiRequest wrapper
│   ├── utils.ts     # cn() and other helpers
│   └── constants.ts # App constants
├── App.tsx          # Root app component
├── main.tsx         # Entry point
└── index.css        # Global styles (Tailwind directives)
```

### Naming Conventions

- **Components**: PascalCase (e.g., `SnippetCard.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useSnippets.ts`)
- **Contexts**: PascalCase with `Context` suffix (e.g., `AuthContext.tsx`)
- **Utils**: camelCase (e.g., `utils.ts`)
- **Pages**: PascalCase (e.g., `Snippets.tsx`)

### Preferred Patterns

#### ✅ DO: Use Functional Components with TypeScript

```tsx
// ✅ Good: client/src/components/SnippetCard.tsx
import { type Snippet } from "@shared/schema";

interface SnippetCardProps {
  snippet: Snippet;
  viewMode: "grid" | "list";
}

export default function SnippetCard({ snippet, viewMode }: SnippetCardProps) {
  // Component logic
}
```

#### ✅ DO: Use Path Aliases

```tsx
// ✅ Good: Always use path aliases
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { type Snippet } from "@shared/schema";
import { cn } from "@/lib/utils";

// ❌ Bad: Relative paths across directories
import { Button } from "../../components/ui/button";
```

#### ✅ DO: Use TailwindCSS Utilities with cn()

```tsx
// ✅ Good: Use cn() from lib/utils.ts
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-blue-50 dark:bg-blue-950",
  className
)} />

// ❌ Bad: Inline styles
<div style={{ borderRadius: "8px", padding: "16px" }} />
```

#### ✅ DO: Use TanStack Query for Data Fetching

```tsx
// ✅ Good: Copy pattern from client/src/pages/Snippets.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const { data: snippets } = useQuery({
  queryKey: ["/api/snippets"],
  queryFn: () => apiRequest<Snippet[]>("/api/snippets")
});

// Mutations
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data: InsertSnippet) => 
    apiRequest("/api/snippets", { method: "POST", body: data }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/snippets"] })
});
```

#### ✅ DO: Use React Context for Global State

```tsx
// ✅ Good: Copy pattern from client/src/contexts/AuthContext.tsx
import { useAuthContext } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, logout } = useAuthContext();
  
  if (!user) return <LoginPrompt />;
  return <div>Welcome, {user.displayName}</div>;
}
```

#### ✅ DO: Use Shadcn UI Components

```tsx
// ✅ Good: Use pre-built Shadcn components from components/ui/
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();
toast({ title: "Success!", description: "Snippet saved." });

// ❌ Bad: Building custom modals from scratch (use Dialog)
```

#### ✅ DO: Handle Auth with Firebase Client SDK

```tsx
// ✅ Good: Copy pattern from client/src/lib/firebase.ts
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Email/password login
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Google OAuth
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
```

#### ❌ DON'T: Use Class Components

```tsx
// ❌ Bad: Legacy class components
class MyComponent extends React.Component {
  render() { /* ... */ }
}

// ✅ Good: Functional components
function MyComponent() {
  return <div>Content</div>;
}
```

#### ❌ DON'T: Fetch Without apiRequest Wrapper

```tsx
// ❌ Bad: Direct fetch without auth token
const response = await fetch("/api/snippets");

// ✅ Good: Use apiRequest() which handles auth tokens automatically
import { apiRequest } from "@/lib/queryClient";
const data = await apiRequest<Snippet[]>("/api/snippets");
```

---

## Touch Points / Key Files

### Critical Files to Understand

- **Entry Point**: `client/src/main.tsx` - App initialization
- **Root Component**: `client/src/App.tsx` - Routing and provider setup
- **Auth Context**: `client/src/contexts/AuthContext.tsx` - User state and Firebase auth
- **Query Client**: `client/src/lib/queryClient.ts` - TanStack Query config + apiRequest wrapper
- **Firebase Config**: `client/src/lib/firebase.ts` - Firebase client SDK initialization
- **Utilities**: `client/src/lib/utils.ts` - cn() helper for Tailwind classes
- **Theme Context**: `client/src/contexts/ThemeContext.tsx` - Dark/light mode
- **Component Examples**:
  - `client/src/components/SnippetCard.tsx` - Complex component with mutations
  - `client/src/components/AddSnippetDialog.tsx` - Form with Zod validation
  - `client/src/components/Header.tsx` - Layout component with auth state

### Important Contexts

- **AuthContext**: User authentication state, login/logout
- **ThemeContext**: Dark/light mode toggle
- **SnippetContext**: Snippet CRUD operations (uses TanStack Query internally)
- **CollectionContext**: Collection management
- **CodeThemeContext**: Prism.js syntax theme selection

---

## JIT Index Hints

```bash
# Find a component
rg -n "export default function" client/src/components

# Find a page
ls client/src/pages/*.tsx

# Find a hook
rg -n "export.*use" client/src/hooks

# Find context usage
rg -n "createContext|useContext" client/src/contexts

# Find all Shadcn UI components
ls client/src/components/ui/

# Find TanStack Query usage
rg -n "useQuery|useMutation" client/src

# Find apiRequest calls
rg -n "apiRequest" client/src

# Check TypeScript errors
npm run check 2>&1 | grep "client/src"
```

---

## Common Gotchas

### 1. Environment Variables Must Use `VITE_` Prefix

```bash
# ✅ Good: Exposed to client
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...

# ❌ Bad: Not exposed (undefined at runtime)
FIREBASE_API_KEY=...
```

Access in code:
```tsx
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

### 2. Always Use `@/` Imports for Client Code

```tsx
// ✅ Good
import { Button } from "@/components/ui/button";

// ❌ Bad
import { Button } from "../../../components/ui/button";
```

### 3. Auth Tokens Handled Automatically by apiRequest

```tsx
// ✅ Good: Token added automatically
import { apiRequest } from "@/lib/queryClient";
const data = await apiRequest("/api/snippets");

// ❌ Bad: Manual token handling not needed
const token = await user.getIdToken();
fetch("/api/snippets", { headers: { Authorization: `Bearer ${token}` } });
```

### 4. Database Types Come from `@shared/schema`

```tsx
// ✅ Good: Import types from shared schema
import { type Snippet, type Collection } from "@shared/schema";

// ❌ Bad: Defining your own types
interface Snippet { /* ... */ }
```

### 5. Toast Notifications via use-toast Hook

```tsx
// ✅ Good
import { useToast } from "@/hooks/use-toast";
const { toast } = useToast();

toast({
  title: "Success!",
  description: "Your changes have been saved.",
});

// ❌ Bad: Using alert() or console.log() for user feedback
alert("Saved!");
```

---

## Pre-PR Checks

Before creating a pull request:

```bash
# 1. Typecheck passes
npm run check

# 2. Build succeeds
npm run build

# 3. No hardcoded secrets
grep -r "AIza" client/src/  # Example: Check for Firebase keys
# Should only find them in .env references, not hardcoded

# 4. Verify .env.example exists (if you added new env vars)
ls .env.example
```

---

## Testing

**Note**: Tests exist in `client/src/components/__tests__/` but no test runner is configured in package.json yet.

Example test structure:
```
client/src/components/
├── SnippetCard.tsx
└── __tests__/
    └── SnippetCard.test.tsx
```

When test runner is added, run:
```bash
# (Future) Run client tests
npm run test:client  # Not yet implemented
```

---

## Example Component Walkthrough

For a complete example of a well-structured component, see:

**`client/src/components/SnippetCard.tsx`**
- TypeScript props interface
- Multiple contexts (Auth, Snippet, Toast)
- TanStack Query mutations
- Shadcn UI components (Dialog, DropdownMenu, AlertDialog)
- TailwindCSS styling with cn()
- Conditional rendering based on auth state
- Copy-to-clipboard functionality
- Share link generation

This is the gold standard for component structure in this project.
