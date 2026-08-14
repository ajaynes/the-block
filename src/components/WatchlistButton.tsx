"use client";

import { useSyncExternalStore } from "react";
import { isWatched, subscribeWatchlist, toggleWatched } from "@/lib/watchlist";
import styles from "./WatchlistButton.module.css";

const getServerSnapshot = () => false;

export function WatchlistButton({ vehicleId, className }: { vehicleId: string; className?: string }) {
  const watched = useSyncExternalStore(
    subscribeWatchlist,
    () => isWatched(vehicleId),
    getServerSnapshot,
  );

  return (
    <button
      type="button"
      className={`btn ${className ?? ""} ${styles.button}`.trim()}
      data-watched={watched}
      aria-pressed={watched}
      aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
      onClick={() => toggleWatched(vehicleId)}
    >
      <span aria-hidden="true">{watched ? "★" : "☆"}</span>
      {watched ? "Watchlisted" : "Watchlist"}
    </button>
  );
}
