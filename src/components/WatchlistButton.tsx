"use client";

import { useSyncExternalStore } from "react";
import { LiaStar } from "react-icons/lia";
import { LiaStarSolid } from "react-icons/lia";
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
      <span aria-hidden="true">{watched ? <LiaStarSolid style={{width: 20, height: 20}} /> : <LiaStar style={{width: 20, height: 20}} />}</span>
      {watched ? "Watched" : "Watchlist"}
    </button>
  );
}
