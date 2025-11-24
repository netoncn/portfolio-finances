import { Badge } from "@/components/ui/badge";

interface IssuerBadgeProps {
  issuer?: string;
  className?: string;
}

const ISSUER_COLORS: Record<string, { bg: string; text: string }> = {
  nubank: {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-800 dark:text-purple-200",
  },
  inter: {
    bg: "bg-orange-100 dark:bg-orange-900",
    text: "text-orange-800 dark:text-orange-200",
  },
  neon: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  c6: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-200",
  },
  "c6 bank": {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-200",
  },
  picpay: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200",
  },
  "mercado pago": {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  next: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200",
  },
  "99pay": {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-800 dark:text-yellow-200",
  },
  itau: {
    bg: "bg-orange-100 dark:bg-orange-900",
    text: "text-orange-800 dark:text-orange-200",
  },
  itaú: {
    bg: "bg-orange-100 dark:bg-orange-900",
    text: "text-orange-800 dark:text-orange-200",
  },
  bradesco: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
  },
  santander: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
  },
  "banco do brasil": {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-800 dark:text-yellow-200",
  },
  bb: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-800 dark:text-yellow-200",
  },
  caixa: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  "caixa econômica": {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  "caixa economica": {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  safra: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  sicoob: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200",
  },
  sicredi: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200",
  },
  xp: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-200",
  },
  btg: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  "btg pactual": {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
};

function getIssuerColors(issuer: string): { bg: string; text: string } {
  const normalizedIssuer = issuer.toLowerCase().trim();

  if (ISSUER_COLORS[normalizedIssuer]) {
    return ISSUER_COLORS[normalizedIssuer];
  }

  for (const [key, colors] of Object.entries(ISSUER_COLORS)) {
    if (normalizedIssuer.includes(key) || key.includes(normalizedIssuer)) {
      return colors;
    }
  }

  return {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-200",
  };
}

export function IssuerBadge({ issuer, className }: IssuerBadgeProps) {
  if (!issuer) {
    return <span className="text-muted-foreground">-</span>;
  }

  const colors = getIssuerColors(issuer);

  return (
    <Badge
      variant="secondary"
      className={`${colors.bg} ${colors.text} ${className || ""}`}
    >
      {issuer}
    </Badge>
  );
}
