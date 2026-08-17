// Local-only auction simulation: manages live bids, mock activity, and
// anti-snipe extensions directly in browser state, persisting via
// `localStorage` so refreshes don't reset progress.

export type SimulatedBid = {
  id: string;
  bidder: string;
  amount: number;
  timestamp: number;
  isUser: boolean;
};

export type AuctionSimState = {
  currentBid: number;
  bidCount: number;
  bidHistory: SimulatedBid[];
  highestBidderIsUser: boolean;
  endsAt: number;
};

export type AuctionSimAction =
  | { type: "HYDRATE"; state: AuctionSimState }
  | { type: "SIMULATED_BID"; bidder: string; amount: number; timestamp: number }
  | { type: "USER_BID"; amount: number; timestamp: number };

// Sets minimum bid raise requirement and stepper increment value.
export const MIN_INCREMENT = 250;

// Auto-extends auction end time for last-second bids.
const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000;
const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;

export const SIMULATED_BID_MIN_DELAY_MS = 10_000;
export const SIMULATED_BID_MAX_DELAY_MS = 30_000;

// Generic labels mask simulated bidding activity and protect real user privacy.
const FAKE_BIDDERS = Array.from({ length: 15 }, (_, i) => `Bidder ${i + 1}`);

const SIMULATED_INCREMENTS = [100, 150, 200, 250, 500];

export function randomBidder(): string {
  return FAKE_BIDDERS[Math.floor(Math.random() * FAKE_BIDDERS.length)];
}

export function randomIncrement(): number {
  return SIMULATED_INCREMENTS[Math.floor(Math.random() * SIMULATED_INCREMENTS.length)];
}

export function randomDelayMs(): number {
  return SIMULATED_BID_MIN_DELAY_MS + Math.random() * (SIMULATED_BID_MAX_DELAY_MS - SIMULATED_BID_MIN_DELAY_MS);
}

function withAntiSnipe(endsAt: number, bidTimestamp: number): number {
  if (endsAt - bidTimestamp <= ANTI_SNIPE_WINDOW_MS) {
    return bidTimestamp + ANTI_SNIPE_EXTENSION_MS;
  }
  return endsAt;
}

export function auctionSimReducer(state: AuctionSimState, action: AuctionSimAction): AuctionSimState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "SIMULATED_BID": {
      // A stale timer can still fire after a newer bid already landed —
      // ignore it rather than moving the price backwards.
      if (action.amount <= state.currentBid) return state;
      const bid: SimulatedBid = {
        id: `${action.timestamp}-${action.bidder}`,
        bidder: action.bidder,
        amount: action.amount,
        timestamp: action.timestamp,
        isUser: false,
      };
      return {
        ...state,
        currentBid: action.amount,
        bidCount: state.bidCount + 1,
        bidHistory: [bid, ...state.bidHistory].slice(0, 20),
        highestBidderIsUser: false,
        endsAt: withAntiSnipe(state.endsAt, action.timestamp),
      };
    }

    case "USER_BID": {
      if (action.amount < state.currentBid + MIN_INCREMENT) return state;
      const bid: SimulatedBid = {
        id: `${action.timestamp}-you`,
        bidder: "You",
        amount: action.amount,
        timestamp: action.timestamp,
        isUser: true,
      };
      return {
        ...state,
        currentBid: action.amount,
        bidCount: state.bidCount + 1,
        bidHistory: [bid, ...state.bidHistory].slice(0, 20),
        highestBidderIsUser: true,
        endsAt: withAntiSnipe(state.endsAt, action.timestamp),
      };
    }

    default:
      return state;
  }
}

const STORAGE_PREFIX = "the-block:auction:";

export function loadAuctionState(vehicleId: string): AuctionSimState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + vehicleId);
    return raw ? (JSON.parse(raw) as AuctionSimState) : null;
  } catch {
    return null;
  }
}

export function saveAuctionState(vehicleId: string, state: AuctionSimState): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + vehicleId, JSON.stringify(state));
  } catch {
    // Storage unavailable (private browsing, quota) — state still works
    // for the current session via in-memory React state.
  }
}
