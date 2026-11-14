
"use client";

import { useState } from "react";
import type { MCPClientGuide } from "./types";
import GuideSteps from "./GuideSteps";
import ExamplePrompts from "./ExamplePrompts";

interface ClientGuideProps {
  guide: MCPClientGuide;
}

export default function ClientGuide({ guide }: ClientGuideProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(guide.endpoint);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-w-0 space-y-8">
      {/* Client introduction */}
      <section className="min-w-0">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Connect Finora to {guide.name}
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          {guide.description}
        </p>

        {guide.availability && (
          <p className="mt-3 text-xs text-slate-500">
            Availability: {guide.availability}
          </p>
        )}
      </section>

      {/* MCP endpoint */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div>
          <h3 className="font-semibold text-slate-900">
            Finora MCP endpoint
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Use this endpoint when configuring your MCP connection.
          </p>
        </div>

        <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row">
          <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-100 px-3 py-3 text-xs leading-6 text-slate-700 sm:text-sm">
            {guide.endpoint}
          </code>

          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {copied ? "Copied!" : "Copy endpoint"}
          </button>
        </div>
      </section>

      {/* Setup walkthrough */}
      <GuideSteps key={guide.id} steps={guide.steps} />

      {/* Optional client-specific notes */}
      {guide.notes && guide.notes.length > 0 && (
        <section className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h3 className="font-semibold text-amber-900">
            Important notes
          </h3>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">
            {guide.notes.map((note, index) => (
              <li key={`${index}-${note}`}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Example prompts */}
      <ExamplePrompts
        // key={guide.id}
        prompts={guide.examplePrompts}
      />
    </div>
  );
}
