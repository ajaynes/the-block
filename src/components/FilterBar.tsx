"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./FilterBar.module.css";

export type FilterGroupKey = "auctionStatus" | "make" | "status" | "body" | "year";

export type FilterOption = {
  value: string;
  label?: string;
  count: number;
};

export type FilterGroup = {
  key: FilterGroupKey;
  label: string;
  options: FilterOption[];
};

type Props = {
  groups: FilterGroup[];
  selected: Record<FilterGroupKey, string[]>;
  sort: string;
};

const VISIBLE_OPTIONS_LIMIT = 5;

function groupsWithHiddenSelection(
  groups: FilterGroup[],
  selected: Record<FilterGroupKey, string[]>,
): FilterGroupKey[] {
  return groups
    .filter((group) => {
      const values = selected[group.key] ?? [];
      const defaultVisible = group.options.slice(0, VISIBLE_OPTIONS_LIMIT).map((o) => o.value);
      return values.some((value) => !defaultVisible.includes(value));
    })
    .map((group) => group.key);
}

export function FilterBar({ groups, selected, sort }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Mobile-only: the sidebar is hidden behind a "Show filters" toggle below
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Every section starts expanded — multiple can be open at once
  const [openGroups, setOpenGroups] = useState<Set<FilterGroupKey>>(
    () => new Set(groups.map((group) => group.key)),
  );

  // Which sections have their "see more" expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<FilterGroupKey>>(
    () => new Set(groupsWithHiddenSelection(groups, selected)),
  );

 // `selected` (and `sort`) lag until router.push() completes. Mirroring to
 // local state ensures instant UI feedback on click; a separate
 // effect resyncs it whenever navigation actually lands.
  const [localSelected, setLocalSelected] = useState(selected);
  const [localSort, setLocalSort] = useState(sort);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSelected(selected);
    setLocalSort(sort);
    const needsExpansion = groupsWithHiddenSelection(groups, selected);
    if (needsExpansion.length > 0) {
      setExpandedGroups((prev) => new Set([...prev, ...needsExpansion]));
    }
    // `groups` is static; omitting it keeps the effect tied purely to navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, sort]);

  const activeCount = Object.values(localSelected).reduce((sum, values) => sum + values.length, 0);

  const chips = groups.flatMap((group) =>
    (localSelected[group.key] ?? []).map((value) => {
      const option = group.options.find((o) => o.value === value);
      return {
        key: group.key,
        label: group.label,
        value,
        displayValue: option?.label ?? value,
      };
    }),
  );

  function navigate(nextSelected: Record<FilterGroupKey, string[]>, nextSort: string) {
    const params = new URLSearchParams();
    for (const group of groups) {
      for (const value of nextSelected[group.key] ?? []) {
        params.append(group.key, value);
      }
    }
    if (nextSort) params.set("sort", nextSort);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function toggleValue(key: FilterGroupKey, value: string) {
    const current = localSelected[key] ?? [];
    const nextValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const next = { ...localSelected, [key]: nextValues };
    setLocalSelected(next);
    navigate(next, localSort);
  }

  function handleSortChange(value: string) {
    setLocalSort(value);
    navigate(localSelected, value);
  }

  function toggleGroupOpen(key: FilterGroupKey) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleExpanded(key: FilterGroupKey) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function resetAll() {
    const cleared = {} as Record<FilterGroupKey, string[]>;
    for (const group of groups) {
      cleared[group.key] = [];
    }
    setLocalSelected(cleared);
    navigate(cleared, localSort);
  }

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        aria-expanded={mobileFiltersOpen}
        onClick={() => setMobileFiltersOpen((prev) => !prev)}
      >
        {mobileFiltersOpen ? "Hide filters" : "Show filters"}
      </button>

      <aside className={styles.sidebar} data-mobile-open={mobileFiltersOpen}>
        {groups.map((group) => {
          const isOpen = openGroups.has(group.key);
          const isExpanded = expandedGroups.has(group.key);
          const values = localSelected[group.key] ?? [];
          const hasMoreOptions = group.options.length > VISIBLE_OPTIONS_LIMIT;
          const visibleOptions = isExpanded
            ? group.options
            : group.options.slice(0, VISIBLE_OPTIONS_LIMIT);

          return (
            <div key={group.key} className={styles.section}>
              <button
                type="button"
                className={styles.sectionHeader}
                aria-expanded={isOpen}
                onClick={() => toggleGroupOpen(group.key)}
              >
                <span>
                  {group.label}
                  {values.length > 0 && ` (${values.length})`}
                </span>
                <span className={styles.chevron} data-open={isOpen}>
                  ⌄
                </span>
              </button>
              {isOpen && (
                <div className={styles.sectionContent}>
                  {visibleOptions.map((option) => (
                    <label key={option.value} className={styles.option}>
                      <input
                        type="checkbox"
                        checked={values.includes(option.value)}
                        onChange={() => toggleValue(group.key, option.value)}
                      />
                      {option.label ?? option.value}
                      <span className={styles.optionCount}>({option.count})</span>
                    </label>
                  ))}
                  {hasMoreOptions && (
                    <button
                      type="button"
                      className={styles.seeMore}
                      onClick={() => toggleExpanded(group.key)}
                    >
                      {isExpanded
                        ? "Show less"
                        : `See more (${group.options.length - VISIBLE_OPTIONS_LIMIT})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {chips.map((chip) => (
            <span key={`${chip.key}-${chip.value}`} className={styles.chip}>
              {chip.label}: {chip.displayValue}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => toggleValue(chip.key, chip.value)}
                aria-label={`Remove ${chip.label}: ${chip.value} filter`}
              >
                ×
              </button>
            </span>
          ))}
          {activeCount > 0 && (
            <button type="button" className={styles.resetAll} onClick={resetAll}>
              Reset all
            </button>
          )}
        </div>

        <select
          className={styles.sort}
          value={localSort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="">Sort by</option>
          <option value="ending-soonest">Ending soonest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="alphabetical">Alphabetical (A–Z)</option>
        </select>
      </div>
    </>
  );
}
