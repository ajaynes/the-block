"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import styles from "./BuyNowPanel.module.css";

type Props = {
  vehicleId: string;
  buyNowPrice: number;
};

const STORAGE_PREFIX = "the-block:buy-now:";
const PURCHASE_DELAY_MS = 350;

function loadPurchased(vehicleId: string): boolean {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + vehicleId) === "true";
  } catch {
    return false;
  }
}

function savePurchased(vehicleId: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + vehicleId, "true");
  } catch {
    // Storage unavailable (private browsing, quota) — state still works
    // for the current session via in-memory React state.
  }
}

export function BuyNowPanel({ vehicleId, buyNowPrice }: Props) {
  // Starts false to match the server-rendered first paint, then swaps in
  // once mounted — same pattern as AuctionCountdown/LiveBidBox's hydration.
  const [purchased, setPurchased] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setPurchased(loadPurchased(vehicleId));
  }, [vehicleId]);

  function handleBuyNow() {
    if (!window.confirm(`Buy this vehicle now for ${formatCurrency(buyNowPrice)}? This skips the auction entirely.`)) {
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      savePurchased(vehicleId);
      setPurchased(true);
      setProcessing(false);
    }, PURCHASE_DELAY_MS);
  }

  if (purchased) {
    return <p className={styles.purchased}>You bought this vehicle for {formatCurrency(buyNowPrice)}! 🎉</p>;
  }

  return (
    <>
      <p className={styles.bidNotice}>Bidding opens when the auction starts.</p>
      <div className={styles.buyNow}>
        <p className={styles.buyNowPrice}>
          Buy Now: <strong>{formatCurrency(buyNowPrice)}</strong>
        </p>
        <button type="button" className="btn btn-secondary" onClick={handleBuyNow} disabled={processing}>
          {processing ? "Processing…" : "Buy Now"}
        </button>
      </div>
    </>
  );
}
