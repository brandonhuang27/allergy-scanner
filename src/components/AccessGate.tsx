"use client";

import { useState } from "react";
import { checkCode } from "@/lib/analyze";

interface Props {
  /** Shown when a previously saved code stopped working. */
  notice?: string | null;
  onAccepted: (code: string) => void;
}

export function AccessGate({ notice, onAccepted }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice ?? null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      if (await checkCode(trimmed)) onAccepted(trimmed);
      else setError("That code isn't right. Check with the person who shared this app.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check the code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Enter your access code</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          This app is in early testing. Enter the code you were given to start scanning.
        </p>
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        placeholder="Access code"
        aria-label="Access code"
        className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-base dark:border-neutral-800 dark:bg-neutral-900"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
