"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import styles from "./AuctionCountdown.module.css";

type Variant = "card" | "detail";

type Props = {
  auctionStart: string;
  auctionEnd: string;
  finalBid?: number | null;
  variant?: Variant;
};

type Status = "upcoming" | "live" | "ended";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function getStatus(nowMs: number, startMs: number, endMs: number): Status {
  if (nowMs < startMs) return "upcoming";
  if (nowMs < endMs) return "live";
  return "ended";
}

function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = Math.max(0, targetMs - nowMs);

  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((diff % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((diff % MINUTE_MS) / SECOND_MS);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

export function AuctionCountdown({
  auctionStart,
  auctionEnd,
  finalBid,
  variant = "card",
}: Props) {
  const startMs = new Date(auctionStart).getTime();
  const endMs = new Date(auctionEnd).getTime();

  // Starts as null so the server-rendered markup and the client's first
  // render match exactly (both render nothing). The real clock value is
  // only read inside useEffect, which runs after hydration is done, so it
  // can never cause a hydration mismatch even if time has moved on.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), SECOND_MS);
    return () => clearInterval(interval);
  }, []);

  if (now === null) {
    return null;
  }

  const status = getStatus(now, startMs, endMs);
  const variantClass = variant === "detail" ? styles.detail : styles.card;
  const statusClass = status === "live" ? styles.live : status === "ended" ? styles.ended : "";
  const className = `${variantClass} ${statusClass}`.trim();

  if (status === "upcoming") {
    return <span className={className}>Starts in {formatCountdown(startMs, now)}</span>;
  }

  if (status === "live") {
    return <span className={className}>Auction ends in {formatCountdown(endMs, now)}</span>;
  }

  return (
    <span className={className}>
      Auction ended
      {typeof finalBid === "number" && ` · Final bid ${formatCurrency(finalBid)}`}
    </span>
  );
}
