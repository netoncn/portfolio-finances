"use client";

import {
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { QuickChatDialog } from "@/components/chat/QuickChatDialog";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DialogType = "chat" | "transaction" | "account" | null;

interface QuickAction {
  icon: React.ElementType;
  label: string;
  action: () => void;
  color: string;
  isLink?: boolean;
  href?: string;
}

export function QuickActionsButton() {
  const t = useTranslations("quickActions");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const handleOpenDialog = (dialog: DialogType) => {
    setActiveDialog(dialog);
    setPopoverOpen(false);
  };

  const actions: QuickAction[] = [
    {
      icon: MessageSquare,
      label: t("chat"),
      action: () => handleOpenDialog("chat"),
      color: "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950",
    },
    {
      icon: Plus,
      label: t("addTransaction"),
      action: () => handleOpenDialog("transaction"),
      color: "text-green-600 hover:bg-green-50 dark:hover:bg-green-950",
    },
    {
      icon: Wallet,
      label: t("addAccount"),
      action: () => handleOpenDialog("account"),
      color: "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950",
    },
    {
      icon: Sparkles,
      label: t("insights"),
      action: () => {},
      color: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950",
      isLink: true,
      href: "/insights",
    },
    {
      icon: TrendingUp,
      label: t("dashboard"),
      action: () => {},
      color: "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950",
      isLink: true,
      href: "/dashboard",
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Zap className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-64 p-2"
            sideOffset={8}
          >
            <div className="space-y-1">
              <div className="px-3 py-2">
                <h3 className="text-sm font-semibold">{t("title")}</h3>
                <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
              </div>
              {actions.map((action, index) => {
                const Icon = action.icon;

                if (action.isLink && action.href) {
                  return (
                    <Link
                      key={index}
                      href={action.href}
                      onClick={() => setPopoverOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 ${action.color}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{action.label}</span>
                      </Button>
                    </Link>
                  );
                }

                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start gap-3 ${action.color}`}
                    onClick={action.action}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <QuickChatDialog
        open={activeDialog === "chat"}
        onOpenChange={(open) => setActiveDialog(open ? "chat" : null)}
      />

      <TransactionForm
        open={activeDialog === "transaction"}
        onOpenChange={(open) => setActiveDialog(open ? "transaction" : null)}
      />

      <AccountFormDialog
        mode="create"
        open={activeDialog === "account"}
        onOpenChange={(open) => setActiveDialog(open ? "account" : null)}
      />
    </>
  );
}
