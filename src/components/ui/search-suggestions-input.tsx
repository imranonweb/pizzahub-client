"use client";

import { Search, X } from "lucide-react";
import {
  type KeyboardEventHandler,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PizzaImage } from "@/components/ui/pizza-image";
import { cn } from "@/lib/utils";

export interface SearchSuggestionOption {
  id: string;
  label: string;
  value: string;
  subtitle?: string;
  badge?: string;
  rightText?: string;
  imageUrl?: string;
}

interface SearchSuggestionsInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  suggestions: readonly SearchSuggestionOption[];
  onSelectSuggestion?: (suggestion: SearchSuggestionOption) => void;
  onFocusPrefetch?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
  ariaLabel: string;
  clearAriaLabel?: string;
  suggestionHeader?: string;
  showWhenEmpty?: boolean;
  isLoadingSuggestions?: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * Accessible search input with live suggestions dropdown and a single custom clear (X) control.
 */
export function SearchSuggestionsInput({
  value,
  onValueChange,
  onClear,
  suggestions,
  onSelectSuggestion,
  onFocusPrefetch,
  onKeyDown,
  inputRef,
  placeholder = "Search...",
  ariaLabel,
  clearAriaLabel = "Clear search",
  suggestionHeader = "Suggestions",
  showWhenEmpty = false,
  isLoadingSuggestions = false,
  className,
  inputClassName,
}: SearchSuggestionsInputProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasQuery = value.trim().length > 0;
  const shouldDisplayList =
    isOpen &&
    (hasQuery || showWhenEmpty) &&
    (suggestions.length > 0 || isLoadingSuggestions);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSelect = (option: SearchSuggestionOption) => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (onSelectSuggestion) {
      onSelectSuggestion(option);
    } else {
      onValueChange(option.value);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (shouldDisplayList && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) =>
          prev <= 0 ? suggestions.length - 1 : prev - 1,
        );
        return;
      }
      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        const selected = suggestions[activeIndex];
        if (selected) {
          handleSelect(selected);
        }
        return;
      }
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }

    onKeyDown?.(event);
  };

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={shouldDisplayList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onFocus={() => {
          setIsOpen(true);
          onFocusPrefetch?.();
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-10 rounded-xl bg-background pr-10 pl-10",
          inputClassName,
        )}
      />

      {value ? (
        <button
          type="button"
          aria-label={clearAriaLabel}
          onClick={() => {
            onClear();
            setActiveIndex(-1);
          }}
          className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}

      {shouldDisplayList ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={suggestionHeader}
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border/90 bg-popover p-1.5 shadow-[0_12px_36px_-10px_rgba(22,15,12,0.22),0_4px_12px_-4px_rgba(22,15,12,0.1)] ring-1 ring-foreground/5"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            <span>{suggestionHeader}</span>
            {suggestions.length > 0 ? (
              <span className="tabular-nums">{suggestions.length} found</span>
            ) : null}
          </div>

          {isLoadingSuggestions && suggestions.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Loading menu suggestions...
            </p>
          ) : (
            <ul className="space-y-0.5">
              {suggestions.map((option, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <li key={option.id}>
                    <button
                      id={`${listboxId}-opt-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/70",
                      )}
                    >
                      {option.imageUrl ? (
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <PizzaImage
                            src={option.imageUrl}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {option.label}
                          </span>
                          {option.badge ? (
                            <Badge
                              variant="secondary"
                              className="shrink-0 rounded-full px-2 py-0 text-[10px]"
                            >
                              {option.badge}
                            </Badge>
                          ) : null}
                        </div>
                        {option.subtitle ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {option.subtitle}
                          </p>
                        ) : null}
                      </div>

                      {option.rightText ? (
                        <span className="shrink-0 font-heading text-xs font-bold text-foreground tabular-nums">
                          {option.rightText}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
