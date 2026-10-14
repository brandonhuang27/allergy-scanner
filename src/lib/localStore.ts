"use client";

import { useSyncExternalStore } from "react";

// A value saved in localStorage so it survives page reloads. useSyncExternalStore
// keeps server rendering (no localStorage) and the browser in agreement: the
// server snapshot is undefined, meaning "not loaded yet".

export function createLocalStore<T>(key: string, isValid: (value: unknown) => value is T) {
  const listeners = new Set<() => void>();
  let cached: T | null | undefined;

  function read(): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot() {
    if (cached === undefined) cached = read();
    return cached;
  }

  function set(value: T | null) {
    cached = value;
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing or storage disabled: keep it in memory for this visit.
    }
    listeners.forEach((l) => l());
  }

  /** The saved value, null if none, or undefined while loading on the server. */
  function useValue(): T | null | undefined {
    return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
  }

  return { set, get: getSnapshot, useValue };
}
