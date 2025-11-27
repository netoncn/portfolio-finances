"use client";

import { useLocale } from "next-intl";
import { forwardRef, useEffect, useState } from "react";
import { Input } from "./input";

interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  value?: number; // Value in cents
  onValueChange?: (cents: number) => void;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const locale = useLocale();
    const [displayValue, setDisplayValue] = useState("");

    const decimalSeparator = locale === "pt-BR" ? "," : ".";
    const thousandsSeparator = locale === "pt-BR" ? "." : ",";

    const centsToDisplay = (cents: number | undefined): string => {
      if (cents === undefined || cents === null || Number.isNaN(cents))
        return "";
      if (cents === 0) return "";
      const amount = cents / 100;
      return amount
        .toFixed(2)
        .replace(".", decimalSeparator)
        .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    };

    const displayToCents = (display: string): number => {
      if (!display) return 0;

      const normalized = display
        .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
        .replace(decimalSeparator, ".");

      const amount = Number.parseFloat(normalized);
      if (Number.isNaN(amount)) return 0;

      return Math.round(amount * 100);
    };

    useEffect(() => {
      if (value !== undefined && value !== displayToCents(displayValue)) {
        setDisplayValue(centsToDisplay(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      if (input === "") {
        setDisplayValue("");
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
      onValueChange?.(displayToCents(cleaned));
    };

    const handleBlur = () => {
      if (displayValue) {
        const cents = displayToCents(displayValue);
        setDisplayValue(centsToDisplay(cents));
        onValueChange?.(cents);
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={locale === "pt-BR" ? "0,00" : "0.00"}
        {...props}
      />
    );
  },
);

MoneyInput.displayName = "MoneyInput";
