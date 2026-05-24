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
}

export function SearchableDropdown({
  value,
  onChange,
  placeholder,
  disabled,
  options,
  theme = "gold"
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Save the typed search string if the user clicked outside
        onChange(search);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [search, onChange]);

  const filteredOptions = options.filter((opt) => {
    const text = typeof opt === "string" ? opt : opt.name || "";
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const themeClasses = {
    gold: {
      focusBorder: "focus:border-[#ffd700]/40 focus:shadow-[0_0_12px_rgba(255,215,0,0.06)]",
      hoverBg: "hover:bg-[#ffd700]/10",
      activeText: "text-[#ffd700] bg-[#ffd700]/5",
    },
    emerald: {
      focusBorder: "focus:border-[#009E4F] focus:shadow-[0_0_12px_rgba(0,158,79,0.15)]",
      hoverBg: "hover:bg-[#009E4F]/10",
      activeText: "text-[#009E4F] bg-[#009E4F]/5",
    },
    teal: {
      focusBorder: "focus:border-teal-500/40 focus:shadow-[0_0_12px_rgba(20,184,166,0.06)]",
      hoverBg: "hover:bg-teal-500/10",
      activeText: "text-teal-400 bg-teal-500/5",
    },
    purple: {
      focusBorder: "focus:border-purple-500/40 focus:shadow-[0_0_12px_rgba(168,85,247,0.06)]",
      hoverBg: "hover:bg-purple-500/10",
      activeText: "text-purple-400 bg-purple-500/5",
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
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`copa-input w-full pl-4 pr-16 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:outline-none ${currentTheme.focusBorder}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {search && !disabled && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onChange("");
                setIsOpen(false);
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
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            className="text-white/40 hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-[#0a0f1e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md copa-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const displayVal = typeof opt === "string" ? opt : opt.name || "";
              return (
                <button
                  key={typeof opt === "string" ? opt : opt.id || displayVal}
                  type="button"
                  onClick={() => {
                    setSearch(displayVal);
                    onChange(displayVal);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors border-b border-white/5 last:border-0 hover:text-white ${currentTheme.hoverBg} ${
                    value === displayVal ? `${currentTheme.activeText} font-bold` : "text-white/70"
                  }`}
                >
                  {displayVal}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-xs text-white/40 italic flex flex-col gap-1">
              <span>Nenhum jogador encontrado na lista.</span>
              <span className="text-[10px] text-white/30">Clique fora do campo para usar "{search}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
