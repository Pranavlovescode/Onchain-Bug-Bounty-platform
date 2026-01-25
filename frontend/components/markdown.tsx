'use client';

import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';

interface MarkdownProps extends Options {
  content: string;
}

/**
 * Markdown component with styled rendering
 * Renders markdown content with Tailwind CSS styling
 */
export function Markdown({ content, ...props }: MarkdownProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ ...componentProps }) => (
            <h1 className="text-2xl font-bold text-gray-100 mt-4 mb-2" {...componentProps} />
          ),
          h2: ({ ...componentProps }) => (
            <h2 className="text-xl font-bold text-gray-200 mt-3 mb-2" {...componentProps} />
          ),
          h3: ({ ...componentProps }) => (
            <h3 className="text-lg font-bold text-gray-300 mt-2 mb-1" {...componentProps} />
          ),
          h4: ({ ...componentProps }) => (
            <h4 className="text-base font-bold text-gray-300 mt-2 mb-1" {...componentProps} />
          ),
          h5: ({ ...componentProps }) => (
            <h5 className="text-sm font-bold text-gray-400 mt-2 mb-1" {...componentProps} />
          ),
          h6: ({ ...componentProps }) => (
            <h6 className="text-xs font-bold text-gray-400 mt-2 mb-1" {...componentProps} />
          ),
          p: ({ ...componentProps }) => <p className="text-gray-300 mb-2 leading-relaxed" {...componentProps} />,
          ul: ({ ...componentProps }) => (
            <ul className="list-disc list-inside text-gray-300 mb-2 ml-2 space-y-1" {...componentProps} />
          ),
          ol: ({ ...componentProps }) => (
            <ol className="list-decimal list-inside text-gray-300 mb-2 ml-2 space-y-1" {...componentProps} />
          ),
          li: ({ ...componentProps }) => <li className="text-gray-300" {...componentProps} />,
          code: ({ ...componentProps }) => (
            <code className="bg-gray-800 text-blue-300 px-2 py-0.5 rounded text-sm" {...componentProps} />
          ),
          pre: ({ ...componentProps }) => (
            <pre className="bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto mb-2 border border-gray-700" {...componentProps} />
          ),
          blockquote: ({ ...componentProps }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-2 bg-gray-800 py-2" {...componentProps} />
          ),
          a: ({ ...componentProps }) => (
            <a className="text-blue-400 hover:text-blue-300 underline" {...componentProps} />
          ),
          hr: ({ ...componentProps }) => <hr className="my-4 border-gray-700" {...componentProps} />,
          table: ({ ...componentProps }) => (
            <table className="w-full border-collapse border border-gray-700 my-2" {...componentProps} />
          ),
          thead: ({ ...componentProps }) => (
            <thead className="bg-gray-800" {...componentProps} />
          ),
          tbody: ({ ...componentProps }) => <tbody {...componentProps} />,
          tr: ({ ...componentProps }) => <tr className="border border-gray-700" {...componentProps} />,
          th: ({ ...componentProps }) => (
            <th className="border border-gray-700 px-3 py-2 text-left font-bold text-gray-100" {...componentProps} />
          ),
          td: ({ ...componentProps }) => (
            <td className="border border-gray-700 px-3 py-2 text-gray-300" {...componentProps} />
          ),
        }}
        {...props}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
