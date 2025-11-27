"use client";

import { useLocale } from "next-intl";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: number; // Value in cents
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void; // Returns value in cents
  currency?: string;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    {
      className,
      value = 0,
      onChange,
      onValueChange,
      currency = "BRL",
      ...props
    },
    ref,
  ) => {
    const locale = useLocale();
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    const decimalSeparator = locale === "pt-BR" ? "," : ".";
    const thousandsSeparator = locale === "pt-BR" ? "." : ",";

    const centsToDisplay = (cents: number): string => {
      if (cents === 0) return "";
      const amount = cents / 100;
      return amount
        .toFixed(2)
        .replace(".", decimalSeparator)
        .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    };

    const displayToCents = (display: string): number => {
      if (!display || display === "") return 0;

      const normalized = display
        .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
        .replace(decimalSeparator, ".");

      const amount = Number.parseFloat(normalized);
      if (Number.isNaN(amount)) return 0;

      return Math.round(amount * 100);
    };

    React.useEffect(() => {
      if (!isFocused && value !== undefined) {
        setDisplayValue(centsToDisplay(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty input
      if (input === "") {
        setDisplayValue("");
        onChange?.(0);
        onValueChange?.(0);
        return;
      }

      let cleaned = input.replace(
        new RegExp(`[^\\d${decimalSeparator.replace(".", "\\.")}]`, "g"),
        "",
      );

      const parts = cleaned.split(decimalSeparator);
      if (parts.length > 2) {
        cleaned = parts[0] + decimalSeparator + parts.slice(1).join("");
      }

      if (parts.length === 2 && parts[1].length > 2) {
        cleaned = parts[0] + decimalSeparator + parts[1].substring(0, 2);
      }

      setDisplayValue(cleaned);
      const cents = displayToCents(cleaned);
      onChange?.(cents);
      onValueChange?.(cents);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (displayValue) {
        const cents = displayToCents(displayValue);
        setDisplayValue(centsToDisplay(cents));
        onChange?.(cents);
        onValueChange?.(cents);
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currency === "BRL" ? "R$" : "$"}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn("pl-12", className)}
          placeholder={locale === "pt-BR" ? "0,00" : "0.00"}
          {...props}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
