"use client";

import { useState } from "react";
import { sendFeedback } from "@/lib/analyze";
import type { AllergyProfile, ScanResult } from "@/lib/types";

interface Props {
  result: ScanResult;
  profile: AllergyProfile;
  photo: string;
}

type State = "ask" | "explain" | "sending" | "sent";

export function Feedback({ result, profile, photo }: Props) {
  const [state, setState] = useState<State>("ask");
  const [comment, setComment] = useState("");
  const [sharePhoto, setSharePhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(rating: "up" | "down") {
    setState("sending");
    setError(null);
    try {
      await sendFeedback({
        rating,
        comment: rating === "down" ? comment : undefined,
        profile,
        result,
        photo: rating === "down" && sharePhoto ? photo : undefined,
      });
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send feedback.");
      setState(rating === "down" ? "explain" : "ask");
    }
  }

  if (state === "sent") {
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        Thanks! Your feedback helps make the scanner safer.
      </p>
    );
  }

  const busy = state === "sending";

  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      {state !== "explain" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Was this result right?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => send("up")}
              aria-label="Yes, the result was right"
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-lg disabled:opacity-50 dark:border-neutral-800"
            >
              👍
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setState("explain")}
              aria-label="No, something was wrong"
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-lg disabled:opacity-50 dark:border-neutral-800"
            >
              👎
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor="feedback-comment" className="text-sm font-medium">
            What was wrong? <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="e.g. It missed the milk, or it misread an ingredient"
            className="rounded-lg border border-neutral-200 bg-white p-2.5 text-base dark:border-neutral-800 dark:bg-neutral-900"
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={sharePhoto}
              onChange={(e) => setSharePhoto(e.target.checked)}
              className="mt-0.5 size-4 accent-emerald-600"
            />
            <span>Include my photo to help improve the app</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setState("ask")}
              className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium dark:border-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => send("down")}
              className="flex-[2] rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send feedback"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
