"use client";

import { FileText, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InstallmentGroupsSection } from "@/components/installments/InstallmentGroupsSection";
import { StatementsSection } from "@/components/statements/StatementsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BillingSectionProps {
  accountId?: string;
  accountName?: string;
}

export function BillingSection({
  accountId,
  accountName,
}: BillingSectionProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<"statements" | "installments">(
    "statements",
  );

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          setActiveTab(value as "statements" | "installments")
        }
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="statements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{t("statements.section.title")}</span>
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>{t("installments.section.title")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="mt-6">
          <StatementsSection accountId={accountId} accountName={accountName} />
        </TabsContent>

        <TabsContent value="installments" className="mt-6">
          <InstallmentGroupsSection accountId={accountId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
