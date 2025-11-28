"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const currentTheme = mounted
    ? theme === "system"
      ? systemTheme
      : theme
    : "light";

  const isDark = currentTheme === "dark";

  return (
    <>
      {mounted && (
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {isDark ? (
            <Sun size={22} aria-hidden="true" />
          ) : (
            <Moon size={22} aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
