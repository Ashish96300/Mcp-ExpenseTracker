
"use client";

import { useState } from "react";

interface ExamplePromptsProps {
  prompts: string[];
}

export default function ExamplePrompts({
  prompts,
}: ExamplePromptsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (prompt: string, index: number) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedIndex(index);

      window.setTimeout(() => {
        setCopiedIndex((current) =>
          current === index ? null : current
        );
      }, 2000);
    } catch {
      setCopiedIndex(null);
    }
  };

  if (prompts.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Try these prompts
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Copy a prompt and try it in your connected AI client.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {prompts.map((prompt, index) => (
          <div
            key={`${index}-${prompt}`}
            className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="min-w-0 flex-1 break-words text-sm leading-6 text-slate-700">
              {prompt}
            </p>

            <button
              type="button"
              onClick={() => handleCopy(prompt, index)}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              aria-label={`Copy prompt ${index + 1}`}
            >
              {copiedIndex === index ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
