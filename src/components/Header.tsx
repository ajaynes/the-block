"use client";

import Image from "next/image";
import Link from "next/link";
import { LiaSearchSolid } from "react-icons/lia";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type SubmitEvent,
} from "react";
import type { VehicleSuggestion } from "@/app/api/vehicle-search/route";
import { formatCurrency } from "@/lib/format";
import styles from "./Header.module.css";

// Mock user context for demo bidding; dropdown links are static stubs.
const FAKE_USER_NAME = "Demo User";
const FAKE_USER_INITIALS = "DU";

const SUGGEST_DEBOUNCE_MS = 200;

const STATUS_LABEL: Record<VehicleSuggestion["status"], string> = {
  live: "Live",
  upcoming: "Upcoming",
  ended: "Ended",
};

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<VehicleSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

 // Sync with URL's `q` param (the source of truth) so external updates,
 // like "Clear search", update the input directly.
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Debounced autocomplete search that cancels pending timers and in-flight fetches on input change.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSuggestOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/vehicle-search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: VehicleSuggestion[] }) => {
          setSuggestions(data.results ?? []);
          setSuggestOpen(true);
          setHighlightedIndex(-1);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setSuggestions([]);
        });
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!suggestOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [suggestOpen]);

  const hasSuggestions = suggestions.length > 0;

  // Combines search suggestions and a navigable "view all results" item.
  const totalOptions = hasSuggestions ? suggestions.length + 1 : 0;
  const viewAllIndex = suggestions.length;

  function goToSearchResults(value: string) {
    router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
    setSuggestOpen(false);
  }

  function goToSuggestion(suggestion: VehicleSuggestion) {
    router.push(`/vehicles/${suggestion.slug}`);
    setSuggestOpen(false);
  }

  function handleSearchSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      goToSuggestion(suggestions[highlightedIndex]);
      return;
    }
    goToSearchResults(query.trim());
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || totalOptions === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalOptions);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (event.key === "Escape") {
      setSuggestOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="The Block" width={175} height={24} priority />
        </Link>

        <div className={styles.search} ref={searchRef}>
          <form role="search" className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (hasSuggestions) setSuggestOpen(true);
              }}
              placeholder="Search by year, make, model…"
              aria-label="Search vehicles"
              autoComplete="off"
              role="combobox"
              aria-expanded={suggestOpen}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={highlightedIndex >= 0 ? `search-option-${highlightedIndex}` : undefined}
            />
            <button type="submit" className={styles.searchButton} aria-label="Search">
              <LiaSearchSolid style={{ width: 26, height: 26}} />
            </button>
          </form>

          {suggestOpen && (
            <ul className={styles.suggestions} role="listbox" id="search-suggestions">
              {hasSuggestions ? (
                <>
                  {suggestions.map((suggestion, index) => (
                    <li key={suggestion.slug} role="presentation">
                      <button
                        type="button"
                        id={`search-option-${index}`}
                        role="option"
                        aria-selected={highlightedIndex === index}
                        className={styles.suggestion}
                        data-highlighted={highlightedIndex === index}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          goToSuggestion(suggestion);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <Image
                          src={suggestion.image}
                          alt=""
                          width={56}
                          height={40}
                          unoptimized
                          className={styles.suggestionImage}
                        />
                        <span className={styles.suggestionText}>
                          <span className={styles.suggestionTitle}>{suggestion.title}</span>
                          <span className={styles.suggestionMeta}>
                            {suggestion.location} · {STATUS_LABEL[suggestion.status]}
                            {suggestion.currentBid !== null && <> · {formatCurrency(suggestion.currentBid)}</>}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  <li role="presentation">
                    <button
                      type="button"
                      id={`search-option-${viewAllIndex}`}
                      role="option"
                      aria-selected={highlightedIndex === viewAllIndex}
                      className={styles.viewAll}
                      data-highlighted={highlightedIndex === viewAllIndex}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        goToSearchResults(query.trim());
                      }}
                      onMouseEnter={() => setHighlightedIndex(viewAllIndex)}
                    >
                      View all results for &ldquo;{query.trim()}&rdquo;
                    </button>
                  </li>
                </>
              ) : (
                <li className={styles.noResults}>No vehicles found for &ldquo;{query.trim()}&rdquo;</li>
              )}
            </ul>
          )}
        </div>

        <div className={styles.user} ref={menuRef}>
          <button
            type="button"
            className={styles.userTrigger}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className={styles.avatar}>{FAKE_USER_INITIALS}</span>
            <span className={styles.userName}>{FAKE_USER_NAME}</span>
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              <button type="button" className={styles.menuItem} role="menuitem">
                My Account
              </button>
              <button type="button" className={styles.menuItem} role="menuitem">
                My Bids
              </button>
              <button type="button" className={styles.menuItem} role="menuitem">
                Watchlist
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
