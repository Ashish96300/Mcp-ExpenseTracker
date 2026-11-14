
"use client";

import type { MCPClientGuide } from "./types";

interface ClientSelectorProps {
  clients: MCPClientGuide[];
  selectedClientId: string;
  onSelect: (clientId: string) => void;
}

export default function ClientSelector({
  clients,
  selectedClientId,
  onSelect,
}: ClientSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => {
        const isSelected = selectedClientId === client.id;

        return (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelect(client.id)}
            aria-pressed={isSelected}
            className={`min-w-0 rounded-xl border p-5 text-left transition ${
              isSelected
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {client.logo ? (
                <img
                  src={client.logo}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {client.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">
                  {client.name}
                </h3>

                {client.availability && (
                  <p className="mt-1 text-xs text-slate-500">
                    {client.availability}
                  </p>
                )}
              </div>

              {isSelected && (
                <span
                  className="shrink-0 text-sm font-semibold text-blue-600"
                  aria-label="Selected"
                >
                  ✓
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {client.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
