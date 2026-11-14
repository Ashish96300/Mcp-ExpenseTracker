
"use client";

import { useState } from "react";
import { helpGuides } from "../data/helpGuides";
import ClientSelector from "./help/ClientSelector";
import ClientGuide from "./help/ClientGuide";

export default function HelpGuide() {
  const [selectedClientId, setSelectedClientId] = useState(
    helpGuides[0]?.id ?? ""
  );

  const selectedGuide = helpGuides.find(
    (guide) => guide.id === selectedClientId
  );

  return (
    <div className="min-w-0 space-y-8">
      {/* Introduction */}
      <section>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Help & Guides
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          Learn how to connect Finora to your favorite AI clients
          using the Model Context Protocol (MCP).
        </p>
      </section>

      {/* Client selection */}
      <section className="min-w-0 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Choose your AI client
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a client to view its connection instructions.
          </p>
        </div>

        <ClientSelector
          clients={helpGuides}
          selectedClientId={selectedClientId}
          onSelect={setSelectedClientId}
        />
      </section>

      {/* Selected client guide */}
      {selectedGuide ? (
        <ClientGuide
          key={selectedGuide.id}
          guide={selectedGuide}
        />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          No client guides are available yet.
        </p>
      )}
    </div>
  );
}
