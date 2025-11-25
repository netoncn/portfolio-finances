"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: number;
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void;
  locale?: string;
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
      locale = "pt-BR",
      currency = "BRL",
      ...props
    },
    ref,
  ) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    const formatValue = (num: number): string => {
      if (num === 0) return "";
      return num.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const parseValue = (str: string): number => {
      if (!str || str === "") return 0;

      let cleaned = str.replace(/\s/g, "");

      const lastComma = cleaned.lastIndexOf(",");
      const lastPeriod = cleaned.lastIndexOf(".");

      if (lastComma > lastPeriod) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }

      const parsed = parseFloat(cleaned);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatValue(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (inputValue === "" || /^[\d.,\s]*$/.test(inputValue)) {
        setDisplayValue(inputValue);

        const numericValue = parseValue(inputValue);
        onChange?.(numericValue);
        onValueChange?.(numericValue);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numericValue = parseValue(displayValue);
      setDisplayValue(formatValue(numericValue));

      onChange?.(numericValue);
      onValueChange?.(numericValue);
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
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
