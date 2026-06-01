"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface SearchableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  options: any[]; // Supports string[] or objects with a 'name' field
  theme?: "gold" | "emerald" | "teal" | "purple";
  menuPlacement?: "top" | "bottom";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchableDropdown({
  value,
  onChange,
  placeholder,
  disabled,
  options,
  theme = "gold",
  menuPlacement = "bottom",
  open,
  onOpenChange,
}: SearchableDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
    setSearch(value || "");
  }, [value]);

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const selectOption = (displayVal: string) => {
    valueRef.current = displayVal;
    setSearch(displayVal);
    onChange(displayVal);
    setOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch(valueRef.current || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isControlled, onOpenChange]);

  const filteredOptions = options.filter((opt) => {
    const text = typeof opt === "string" ? opt : opt.name || "";
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const themeClasses = {
    gold: {
      focusBorder: "focus:border-[#ffd700]/40 focus:shadow-[0_0_12px_rgba(255,215,0,0.06)]",
      menuPanel: "bg-[#0f1628] border border-[#ffd700]/25 shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
      optionBase: "bg-[#131d32] hover:bg-[#1a2740] hover:text-white",
      activeText: "text-[#ffd700] bg-[#2a2410] font-bold",
      emptyBg: "bg-[#131d32]",
    },
    emerald: {
      focusBorder: "focus:border-[#009E4F] focus:shadow-[0_0_12px_rgba(0,158,79,0.15)]",
      menuPanel: "bg-[#0a0f1e] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
      optionBase: "bg-[#111827] hover:bg-[#1a2332] hover:text-white",
      activeText: "text-[#009E4F] bg-[#0f2a1c] font-bold",
      emptyBg: "bg-[#111827]",
    },
    teal: {
      focusBorder: "focus:border-teal-500/40 focus:shadow-[0_0_12px_rgba(20,184,166,0.06)]",
      menuPanel: "bg-[#0c1520] border border-teal-500/25 shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
      optionBase: "bg-[#101f28] hover:bg-[#152a35] hover:text-white",
      activeText: "text-teal-300 bg-[#0f2a2a] font-bold",
      emptyBg: "bg-[#101f28]",
    },
    purple: {
      focusBorder: "focus:border-purple-500/40 focus:shadow-[0_0_12px_rgba(168,85,247,0.06)]",
      menuPanel: "bg-[#12101f] border border-purple-500/25 shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
      optionBase: "bg-[#1a1530] hover:bg-[#241e42] hover:text-white",
      activeText: "text-purple-300 bg-[#221a3d] font-bold",
      emptyBg: "bg-[#1a1530]",
    },
  };

  const currentTheme = themeClasses[theme] || themeClasses.gold;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          placeholder={placeholder}
          className={`copa-input w-full pl-4 pr-16 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:outline-none ${currentTheme.focusBorder}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {search && !disabled && (
            <button
              type="button"
              onClick={() => {
                valueRef.current = "";
                setSearch("");
                onChange("");
                setOpen(false);
              }}
              className="text-white/40 hover:text-white transition-colors p-1"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) setOpen(!isOpen);
            }}
            className="text-white/40 hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full max-h-60 overflow-y-auto rounded-xl copa-scrollbar ${
            menuPlacement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${currentTheme.menuPanel}`}
        >
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.slice(0, 50).map((opt) => {
                const displayVal = typeof opt === "string" ? opt : opt.name || "";
                return (
                  <button
                    key={typeof opt === "string" ? opt : opt.id || displayVal}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectOption(displayVal);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors border-b border-white/8 last:border-0 ${currentTheme.optionBase} ${
                      value === displayVal ? currentTheme.activeText : "text-white/85"
                    }`}
                  >
                    {displayVal}
                  </button>
                );
              })}
              {filteredOptions.length > 50 && (
                <div className="px-4 py-3 text-[10px] text-center text-white/40 italic bg-black/20 border-t border-white/5">
                  Mostrando 50 de {filteredOptions.length} resultados. Continue digitando para filtrar...
                </div>
              )}
            </>
          ) : (
            <div className={`px-4 py-3 text-xs text-white/50 ${currentTheme.emptyBg}`}>
              Nenhum jogador encontrado na lista.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
