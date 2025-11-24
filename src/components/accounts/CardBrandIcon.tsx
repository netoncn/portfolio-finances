import { CreditCard } from "lucide-react";
import type { CardBrand } from "@/domain/accounts/types/account";

interface CardBrandIconProps {
  brand: CardBrand;
  className?: string;
}

const BRAND_COLORS: Record<CardBrand, string> = {
  visa: "text-blue-600 dark:text-blue-400",
  mastercard: "text-red-600 dark:text-red-400",
  amex: "text-blue-700 dark:text-blue-500",
  elo: "text-yellow-600 dark:text-yellow-400",
  hipercard: "text-red-700 dark:text-red-500",
  vr: "text-green-600 dark:text-green-400",
  sodexo: "text-orange-600 dark:text-orange-400",
  alelo: "text-green-700 dark:text-green-500",
  other: "text-gray-600 dark:text-gray-400",
};

export function CardBrandIcon({
  brand,
  className = "size-5",
}: CardBrandIconProps) {
  const colorClass = BRAND_COLORS[brand];

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <CreditCard className={`size-full ${colorClass}`} />
    </div>
  );
}

export function CardBrandBadge({
  brand,
  showName = true,
}: {
  brand: CardBrand;
  showName?: boolean;
}) {
  const colorClass = BRAND_COLORS[brand];

  const brandNames: Record<CardBrand, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    elo: "Elo",
    hipercard: "Hipercard",
    vr: "VR",
    sodexo: "Sodexo",
    alelo: "Alelo",
    other: "Outro",
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <CreditCard className={`size-4 ${colorClass}`} />
      {showName && <span className="text-sm">{brandNames[brand]}</span>}
    </div>
  );
}
