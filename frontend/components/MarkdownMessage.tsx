import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

export function MarkdownMessage({ content, isUser, className }: MarkdownMessageProps) {
  if (isUser) {
    // User messages: plain text, no markdown needed
    return <span className={className}>{content}</span>;
  }

  return (
    <div className={cn("prose-chat", className)}>
    <ReactMarkdown
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
        ),
        // Bold: **text** or __text__
        strong: ({ children }) => (
          <strong className="font-bold text-foreground">{children}</strong>
        ),
        // Italic: *text* or _text_
        em: ({ children }) => (
          <em className="italic opacity-90">{children}</em>
        ),
        // Inline code: `code`
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block bg-black/10 rounded-sm px-2 py-1 text-[10px] font-mono my-1 whitespace-pre-wrap">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-black/10 rounded-sm px-1 py-0.5 text-[10px] font-mono">
              {children}
            </code>
          );
        },
        // Unordered lists
        ul: ({ children }) => (
          <ul className="list-none space-y-0.5 my-1.5 pl-2">{children}</ul>
        ),
        // Ordered lists
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-0.5 my-1.5 pl-2 [counter-reset:list-item]">{children}</ol>
        ),
        // List items with custom bullet
        li: ({ children }) => (
          <li className="flex items-start gap-1.5 text-[11px]">
            <span className="mt-1 w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" />
            <span>{children}</span>
          </li>
        ),
        // Headings — downscale them for chat context
        h1: ({ children }) => (
          <p className="font-black text-sm mt-2 mb-1">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="font-black text-[11px] uppercase tracking-wider mt-2 mb-1 text-primary">{children}</p>
        ),
        h3: ({ children }) => (
          <p className="font-bold text-[10px] uppercase tracking-widest mt-1.5 mb-0.5 text-muted-foreground">{children}</p>
        ),
        // Horizontal rule
        hr: () => <hr className="my-2 border-current opacity-20" />,
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-current pl-2 opacity-80 my-1 italic">
            {children}
          </blockquote>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 opacity-90 hover:opacity-100"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
