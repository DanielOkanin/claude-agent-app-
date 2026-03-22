import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.min.css'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-slate-600 hover:bg-slate-500 text-slate-300 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      children={content}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('hljs') || className?.includes('language-')
          const text = String(children).replace(/\n$/, '')

          if (isBlock) {
            return (
              <div className="relative my-3 group">
                <CopyButton text={text} />
                <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          }

          return (
            <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse border border-slate-600">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-slate-600 px-3 py-2 bg-slate-700 text-left text-sm font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-slate-600 px-3 py-2 text-sm">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-slate-500 pl-4 my-3 text-slate-300 italic">
            {children}
          </blockquote>
        )
      }}
    />
  )
}
