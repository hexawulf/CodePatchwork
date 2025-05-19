-- First, create snippets table if it doesn't exist
CREATE TABLE IF NOT EXISTS snippets (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR,
    tags TEXT[],
    userId VARCHAR,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    viewCount INTEGER DEFAULT 0,
    isFavorite BOOLEAN DEFAULT false,
    shareId VARCHAR,
    isPublic BOOLEAN DEFAULT false
);

-- Clear existing data if any
TRUNCATE snippets RESTART IDENTITY;

-- Insert the snippets data
INSERT INTO snippets (id, title, description, code, language, tags, userId, createdAt, updatedAt, viewCount, isFavorite, shareId, isPublic)
VALUES
(1, 'React useLocalStorage Hook', 'Custom React hook to persist state in localStorage with type safety.', 'import { useState, useEffect } from ''react'';\n\nfunction useLocalStorage<T>(\n  key: string, \n  initialValue: T\n): [T, (value: T) => void] {\n  // Get stored value\n  const readValue = (): T => {\n    if (typeof window === ''undefined'') {\n      return initialValue;\n    }\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      console.warn(''Error reading localStorage key'', error);\n      return initialValue;\n    }\n  };\n  \n  const [storedValue, setStoredValue] = useState<T>(readValue);\n  \n  // Return a wrapped version of useState''s setter\n  const setValue = (value: T) => {\n    try {\n      // Save state\n      setStoredValue(value);\n      // Save to localStorage\n      window.localStorage.setItem(key, JSON.stringify(value));\n    } catch (error) {\n      console.warn(''Error setting localStorage key'', error);\n    }\n  };\n\n  useEffect(() => {\n    setStoredValue(readValue());\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  return [storedValue, setValue];\n}', 'tsx', ARRAY['react', 'hooks', 'typescript'], null, '2025-05-16T08:51:32.268Z', '2025-05-16T08:51:32.268Z', 12, false, null, false),

(2, 'Python Decorator for Timing', 'A simple Python decorator to measure and log function execution time.', 'import time\nimport functools\nimport logging\n\ndef timer(func):\n    \"\"\"Print the runtime of the decorated function\"\"\"\n    @functools.wraps(func)\n    def wrapper_timer(*args, **kwargs):\n        start_time = time.perf_counter()\n        value = func(*args, **kwargs)\n        end_time = time.perf_counter()\n        run_time = end_time - start_time\n        logging.info(f\"Completed {func.__name__!r} in {run_time:.4f} secs\")\n        return value\n    return wrapper_timer\n\n# Example usage\n@timer\ndef waste_some_time(num_times):\n    for _ in range(num_times):\n        sum([i**2 for i in range(10000)])\n        \n# Call it\nwaste_some_time(100)', 'python', ARRAY['python', 'decorators', 'performance'], null, '2025-05-16T08:51:32.268Z', '2025-05-16T08:51:32.268Z', 24, false, null, false),

(3, 'CSS Grid Layout Template', 'Responsive grid layout with areas for header, sidebar, content and footer.', '.grid-container {\n  display: grid;\n  grid-template-columns: repeat(12, 1fr);\n  grid-template-rows: auto 1fr auto;\n  grid-template-areas:\n    \"h h h h h h h h h h h h\"\n    \"s s c c c c c c c c c c\"\n    \"f f f f f f f f f f f f\";\n  min-height: 100vh;\n  gap: 1rem;\n}\n\n.header { grid-area: h; }\n.sidebar { grid-area: s; }\n.content { grid-area: c; }\n.footer { grid-area: f; }\n\n/* Tablet layout */\n@media (max-width: 992px) {\n  .grid-container {\n    grid-template-areas:\n      \"h h h h h h h h h h h h\"\n      \"s s s s c c c c c c c c\"\n      \"f f f f f f f f f f f f\";\n  }\n}\n\n/* Mobile layout */\n@media (max-width: 768px) {\n  .grid-container {\n    grid-template-areas:\n      \"h h h h h h h h h h h h\"\n      \"c c c c c c c c c c c c\"\n      \"s s s s s s s s s s s s\"\n      \"f f f f f f f f f f f f\";\n  }\n}', 'css', ARRAY['css', 'grid', 'responsive'], null, '2025-05-16T08:51:32.268Z', '2025-05-16T08:51:32.268Z', 41, true, null, false);

-- Continue with the rest of the snippets 4-10
-- ...

-- Create collections table if needed
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    userId VARCHAR,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for tags if needed
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    count INTEGER DEFAULT 1
);

-- Insert unique tags from the snippets
INSERT INTO tags (name)
SELECT DISTINCT unnest(tags) FROM snippets
ON CONFLICT (name) DO NOTHING;

-- Update tag counts
UPDATE tags SET count = (
    SELECT COUNT(*) FROM snippets, unnest(snippets.tags) as snippet_tag
    WHERE snippet_tag = tags.name
);
