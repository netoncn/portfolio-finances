"use client";

import {
  Award,
  Coins,
  Gift,
  type LucideIcon,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import type { PointsProgramName } from "@/domain/points/types/points";
import { cn } from "@/lib/utils";

interface ProgramIconProps {
  program: PointsProgramName;
  className?: string;
}

const PROGRAM_ICONS: Record<PointsProgramName, LucideIcon> = {
  livelo: Star,
  esfera: Sparkles,
  iupp: Gift,
  smiles: Plane,
  latam_pass: Plane,
  tudoazul: Plane,
  ame: ShoppingBag,
  meli: Coins,
  outro: Award,
};

const PROGRAM_COLORS: Record<PointsProgramName, string> = {
  livelo: "text-purple-600",
  esfera: "text-blue-600",
  iupp: "text-orange-600",
  smiles: "text-orange-500",
  latam_pass: "text-red-600",
  tudoazul: "text-blue-500",
  ame: "text-pink-600",
  meli: "text-yellow-500",
  outro: "text-gray-600",
};

export function ProgramIcon({ program, className }: ProgramIconProps) {
  const Icon = PROGRAM_ICONS[program] || Award;
  const colorClass = PROGRAM_COLORS[program] || "text-gray-600";

  return <Icon className={cn("size-5", colorClass, className)} />;
}

export function getProgramDisplayName(program: PointsProgramName): string {
  const names: Record<PointsProgramName, string> = {
    livelo: "Livelo",
    esfera: "Esfera",
    iupp: "iupp",
    smiles: "Smiles",
    latam_pass: "LATAM Pass",
    tudoazul: "TudoAzul",
    ame: "Ame",
    meli: "Mercado Pontos",
    outro: "Outro",
  };
  return names[program] || program;
}
