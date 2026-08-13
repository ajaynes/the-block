"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./FilterBar.module.css";

export type FilterGroupKey = "make" | "status" | "body" | "year";

export type FilterOption = {
  value: string;
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

export function FilterBar({ groups, selected }: Props) {
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

 // `selected` lags until router.push() completes. Mirroring to
 // local state ensures instant UI feedback on click; a separate
 // effect resyncs it whenever navigation actually lands.
  const [localSelected, setLocalSelected] = useState(selected);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSelected(selected);
    const needsExpansion = groupsWithHiddenSelection(groups, selected);
    if (needsExpansion.length > 0) {
      setExpandedGroups((prev) => new Set([...prev, ...needsExpansion]));
    }
    // `groups` is static; omitting it keeps the effect tied purely to navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const activeCount = Object.values(localSelected).reduce((sum, values) => sum + values.length, 0);

  const chips = groups.flatMap((group) =>
    (localSelected[group.key] ?? []).map((value) => ({
      key: group.key,
      label: group.label,
      value,
    })),
  );

  function navigate(nextSelected: Record<FilterGroupKey, string[]>) {
    const params = new URLSearchParams();
    for (const group of groups) {
      for (const value of nextSelected[group.key] ?? []) {
        params.append(group.key, value);
      }
    }
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  function toggleValue(key: FilterGroupKey, value: string) {
    const current = localSelected[key] ?? [];
    const nextValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const next = { ...localSelected, [key]: nextValues };
    setLocalSelected(next);
    navigate(next);
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
    router.push(pathname);
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
                      {option.value}
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
              {chip.label}: {chip.value}
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

        <select className={styles.sort} disabled defaultValue="">
          <option value="" disabled>
            Sort by
          </option>
          <option value="ending-soon">Ending soon</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </>
  );
}
