import { useSnippetContext } from "@/contexts/SnippetContext";
import { cn } from "@/lib/utils";

interface TagCloudProps {
  tags: string[];
  className?: string;
  maxTags?: number;
}

export default function TagCloud({ tags, className, maxTags = 20 }: TagCloudProps) {
  const { activeTag, setActiveTag } = useSnippetContext();
  
  // Handle tag click
  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  // Limit the number of tags to display
  const displayTags = tags.slice(0, maxTags);
  const hasMoreTags = tags.length > maxTags;
  
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map(tag => (
        <button
          key={tag}
          onClick={() => handleTagClick(tag)}
          className={cn(
            "text-xs py-1 px-2 rounded-full",
            activeTag === tag
              ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          )}
        >
          {tag}
        </button>
      ))}
      
      {hasMoreTags && (
        <span className="text-xs py-1 px-2 bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-700 dark:text-primary-300">
          +{tags.length - maxTags} more
        </span>
      )}
    </div>
  );
}
