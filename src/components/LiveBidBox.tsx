"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import {
  auctionSimReducer,
  BID_INCREMENT_OPTIONS,
  loadAuctionState,
  MIN_INCREMENT,
  randomBidder,
  randomDelayMs,
  randomIncrement,
  saveAuctionState,
  type AuctionSimState,
  type BidIncrement,
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
  buyNowPrice: number | null;
};

const SUBMIT_DELAY_MS = 350;

export function LiveBidBox({
  vehicleId,
  startingBid,
  initialCurrentBid,
  initialBidCount,
  auctionStart,
  auctionEnd,
  buyNowPrice,
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

  const [increment, setIncrement] = useState<BidIncrement>(100);
  const [bidValue, setBidValue] = useState(initialState.currentBid + increment);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Keeps the suggested bid amount current (current bid + chosen increment)
  // until the user starts customizing it, so it doesn't fight their typing.
  useEffect(() => {
    if (!touched) setBidValue(state.currentBid + increment);
  }, [state.currentBid, increment, touched]);

  const minNextBid = state.currentBid + MIN_INCREMENT;
  const isValid = bidValue >= minNextBid;
  const hasUserBid = state.bidHistory.some((bid) => bid.isUser);

  function handleStep(direction: 1 | -1) {
    setTouched(true);
    setError(null);
    setBidValue((prev) => Math.max(minNextBid, prev + direction * increment));
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
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      dispatch({ type: "USER_BID", amount: bidValue, timestamp: Date.now() });
      setSubmitting(false);
      setTouched(false);
    }, SUBMIT_DELAY_MS);
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
    // noValidate: the browser's native step/min constraint validation would
    // otherwise gate submission on its own grid (e.g. "nearest valid values
    // are X and Y"), rejecting any amount that isn't min + N*step. A bid
    // only needs to clear the minimum increment, not land on that grid —
    // our own `isValid` check below is the actual rule.
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

      <div className={styles.incrementSelector} role="radiogroup" aria-label="Bid increment">
        {BID_INCREMENT_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={increment === option}
            data-active={increment === option}
            className={styles.incrementOption}
            onClick={() => setIncrement(option)}
          >
            +{formatCurrency(option)}
          </button>
        ))}
      </div>

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
              aria-label={`Increase bid by ${formatCurrency(increment)}`}
              onClick={() => handleStep(1)}
            >
              ▲
            </button>
            <button
              type="button"
              aria-label={`Decrease bid by ${formatCurrency(increment)}`}
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

      {hasUserBid && (
        <p className={state.highestBidderIsUser ? styles.winning : styles.outbid} aria-live="polite">
          {state.highestBidderIsUser ? "You're winning" : "You've been outbid"}
        </p>
      )}

      <p className={styles.bidMeta}>
        Starting Bid: {formatCurrency(startingBid)}
        {buyNowPrice !== null && <> · Buy Now: {formatCurrency(buyNowPrice)}</>}
      </p>

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
  );
}
