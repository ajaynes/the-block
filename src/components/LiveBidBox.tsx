"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  auctionSimReducer,
  loadAuctionState,
  MIN_INCREMENT,
  randomBidder,
  randomDelayMs,
  randomIncrement,
  saveAuctionState,
  type AuctionSimState,
} from "@/lib/auction-simulation";
import { formatCurrency } from "@/lib/format";
import styles from "./LiveBidBox.module.css";

type Props = {
  vehicleId: string;
  startingBid: number;
  initialCurrentBid: number | null;
  initialBidCount: number;
  auctionStart: string;
  auctionEnd: string;
};

const SUBMIT_DELAY_MS = 350;

const BID_DISCLAIMER_KEY = "the-block:bid-disclaimer-acknowledged";

function hasAcknowledgedBidDisclaimer(): boolean {
  try {
    return window.localStorage.getItem(BID_DISCLAIMER_KEY) === "true";
  } catch {
    return false;
  }
}

function acknowledgeBidDisclaimer(): void {
  try {
    window.localStorage.setItem(BID_DISCLAIMER_KEY, "true");
  } catch {
    // Storage unavailable — the confirmation will just show again next time.
  }
}

export function LiveBidBox({
  vehicleId,
  startingBid,
  initialCurrentBid,
  initialBidCount,
  auctionStart,
  auctionEnd,
}: Props) {
  const initialState: AuctionSimState = {
    currentBid: initialCurrentBid ?? startingBid,
    bidCount: initialBidCount,
    bidHistory: [],
    highestBidderIsUser: false,
    endsAt: new Date(auctionEnd).getTime(),
  };

  const [state, dispatch] = useReducer(auctionSimReducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const [bidValue, setBidValue] = useState(initialState.currentBid + MIN_INCREMENT);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Restore any persisted auction state after mount — kept out of the
  // initial render so server and client agree on the first paint, then
  // swapped in once we know we're on the client (see AuctionCountdown for
  // the same pattern applied to the countdown clock).
  useEffect(() => {
    const saved = loadAuctionState(vehicleId);
    if (saved) dispatch({ type: "HYDRATE", state: saved });
    setHydrated(true);
    setNowMs(Date.now());
  }, [vehicleId]);

  useEffect(() => {
    if (!hydrated) return;
    saveAuctionState(vehicleId, state);
  }, [hydrated, vehicleId, state]);

  // Ticks locally so we can tell when the (possibly anti-snipe-extended)
  // auction has ended, independent of the server-computed status passed in.
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hasEnded = nowMs !== null && nowMs >= state.endsAt;

  // Mock bidders — the thing that actually sells "this is a live auction"
  // to anyone watching, since the price moves without them touching it.
  // Re-schedules itself on every currentBid change (from anyone), which is
  // effectively "wait another random 10-30s from the last bid."
  useEffect(() => {
    if (hasEnded) return;
    const timer = setTimeout(() => {
      dispatch({
        type: "SIMULATED_BID",
        bidder: randomBidder(),
        amount: state.currentBid + randomIncrement(),
        timestamp: Date.now(),
      });
    }, randomDelayMs());
    return () => clearTimeout(timer);
  }, [hasEnded, state.currentBid]);

  // Keeps the suggested bid amount current (current bid + increment) until
  // the user starts customizing it, so it doesn't fight their typing.
  useEffect(() => {
    if (!touched) setBidValue(state.currentBid + MIN_INCREMENT);
  }, [state.currentBid, touched]);

  const minNextBid = state.currentBid + MIN_INCREMENT;
  const isValid = bidValue >= minNextBid;
  const hasUserBid = state.bidHistory.some((bid) => bid.isUser);

  function handleStep(direction: 1 | -1) {
    setTouched(true);
    setError(null);
    setBidValue((prev) => Math.max(minNextBid, prev + direction * MIN_INCREMENT));
  }

  function handleInputChange(value: number) {
    setTouched(true);
    setError(null);
    setBidValue(Number.isFinite(value) ? value : 0);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) {
      setError(`Minimum bid is ${formatCurrency(minNextBid)}`);
      return;
    }

    // Only the first bid a user ever places needs the disclaimer — once
    // acknowledged, it's persisted so it doesn't nag on every later bid.
    if (!hasAcknowledgedBidDisclaimer()) {
      setShowDisclaimer(true);
      return;
    }

    submitBid();
  }

  function submitBid() {
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      dispatch({ type: "USER_BID", amount: bidValue, timestamp: Date.now() });
      setSubmitting(false);
      setTouched(false);
    }, SUBMIT_DELAY_MS);
  }

  function handleDisclaimerConfirm() {
    acknowledgeBidDisclaimer();
    setShowDisclaimer(false);
    submitBid();
  }

  if (hasEnded) {
    return (
      <>
        <p className={styles.currentBid}>Final Bid: {formatCurrency(state.currentBid)}</p>
        <p className={styles.bidCount}>
          {state.bidCount} {state.bidCount === 1 ? "bid" : "bids"}
        </p>
        {hasUserBid && (
          <p className={state.highestBidderIsUser ? styles.winning : styles.outbid}>
            {state.highestBidderIsUser ? "You won this auction! 🎉" : "You were outbid — auction ended"}
          </p>
        )}
        <AuctionCountdown
          auctionStart={auctionStart}
          auctionEnd={new Date(state.endsAt).toISOString()}
          finalBid={state.currentBid}
          variant="detail"
        />
      </>
    );
  }

  return (
    <>
    {showDisclaimer && (
      <ConfirmDialog
        title="Confirm Your Bid"
        message="This bid is real. If you win the auction, you'll be responsible for completing payment."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleDisclaimerConfirm}
        onCancel={() => setShowDisclaimer(false)}
      />
    )}
    {/* Disables native HTML validation so bids aren't locked to a rigid
       step grid—only our custom `isValid` minimum check applies.
    */}
    <form onSubmit={handleSubmit} noValidate>
      <p className={styles.currentBid}>
        Current Bid: {state.bidCount > 0 ? formatCurrency(state.currentBid) : "No bids yet"}
      </p>
      <p className={styles.bidCount}>
        {state.bidCount} {state.bidCount === 1 ? "bid" : "bids"}
      </p>


      <AuctionCountdown
        auctionStart={auctionStart}
        auctionEnd={new Date(state.endsAt).toISOString()}
        finalBid={state.currentBid}
        variant="detail"
      />

      <p className={styles.incrementNote}>Bids increase in increments of {formatCurrency(MIN_INCREMENT)}.</p>

      <div className={styles.bidRow}>
        <div className={styles.stepperInput}>
          <input
            type="number"
            value={bidValue}
            min={minNextBid}
            step="any"
            aria-label="Bid amount"
            onChange={(event) => handleInputChange(event.target.valueAsNumber)}
          />
          <div className={styles.stepperButtons}>
            <button
              type="button"
              aria-label={`Increase bid by ${formatCurrency(MIN_INCREMENT)}`}
              onClick={() => handleStep(1)}
            >
              ▲
            </button>
            <button
              type="button"
              aria-label={`Decrease bid by ${formatCurrency(MIN_INCREMENT)}`}
              disabled={bidValue <= minNextBid}
              onClick={() => handleStep(-1)}
            >
              ▼
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!isValid || submitting}>
          {submitting ? "Placing bid…" : "Place Bid"}
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <p
        className={hasUserBid ? (state.highestBidderIsUser ? styles.winning : styles.outbid) : styles.noBid}
        aria-live="polite"
      >
        {hasUserBid ? (state.highestBidderIsUser ? "You're winning" : "You've been outbid") : "You haven't bid"}
      </p>

      <p className={styles.bidMeta}>Starting Bid: {formatCurrency(startingBid)}</p>

      {state.bidHistory.length > 0 && (
        <ul className={styles.bidHistory} aria-live="polite">
          {state.bidHistory.slice(0, 5).map((bid) => (
            <li key={bid.id} className={bid.isUser ? styles.bidHistoryUser : undefined}>
              <span>{bid.bidder}</span>
              <span>{formatCurrency(bid.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
    </>
  );
}
