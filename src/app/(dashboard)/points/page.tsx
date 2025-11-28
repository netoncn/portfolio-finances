"use client";

import {
  AlertTriangle,
  Calculator,
  Coins,
  Gift,
  History,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExportButton } from "@/components/export/ExportButton";
import { ExpirationAlerts } from "@/components/points/ExpirationAlerts";
import { PointsBalanceFormDialog } from "@/components/points/PointsBalanceFormDialog";
import { PointsBalancesTable } from "@/components/points/PointsBalancesTable";
import { PointsCalculator } from "@/components/points/PointsCalculator";
import { PointsOfferFormDialog } from "@/components/points/PointsOfferFormDialog";
import { PointsOffersTable } from "@/components/points/PointsOffersTable";
import { PointsOperationFormDialog } from "@/components/points/PointsOperationFormDialog";
import { PointsOperationsTable } from "@/components/points/PointsOperationsTable";
import { PointsProgramFormDialog } from "@/components/points/PointsProgramFormDialog";
import { PointsProgramsTable } from "@/components/points/PointsProgramsTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PointsBalance,
  PointsOffer,
  PointsOperation,
  PointsProgram,
} from "@/domain/points/types/points";
import { useAccounts } from "@/hooks/use-accounts";
import { usePointsBalances } from "@/hooks/use-points-balances";
import { usePointsOffers } from "@/hooks/use-points-offers";
import { usePointsOperations } from "@/hooks/use-points-operations";
import { usePointsPrograms } from "@/hooks/use-points-programs";
import { pointsProgramColumns } from "@/lib/export/columns";

function formatPoints(points: number): string {
  return new Intl.NumberFormat("pt-BR").format(points);
}

export default function PointsPage() {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");

  const {
    data: programs = [],
    isLoading: programsLoading,
    error: programsError,
  } = usePointsPrograms();

  const { data: balances = [], isLoading: balancesLoading } =
    usePointsBalances();

  const { data: operations = [], isLoading: operationsLoading } =
    usePointsOperations();

  const { data: offers = [], isLoading: offersLoading } = usePointsOffers();

  const { data: accounts = [] } = useAccounts();

  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<
    PointsProgram | undefined
  >();
  const [programDialogMode, setProgramDialogMode] = useState<"create" | "edit">(
    "create",
  );

  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<
    PointsBalance | undefined
  >();
  const [balanceDialogMode, setBalanceDialogMode] = useState<"create" | "edit">(
    "create",
  );

  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<
    PointsOperation | undefined
  >();
  const [operationDialogMode, setOperationDialogMode] = useState<
    "create" | "edit"
  >("create");

  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PointsOffer | undefined>();
  const [offerDialogMode, setOfferDialogMode] = useState<"create" | "edit">(
    "create",
  );

  const [activeTab, setActiveTab] = useState("programs");

  const handleCreateProgram = () => {
    setSelectedProgram(undefined);
    setProgramDialogMode("create");
    setProgramDialogOpen(true);
  };

  const handleProgramClick = (program: PointsProgram) => {
    setSelectedProgram(program);
    setProgramDialogMode("edit");
    setProgramDialogOpen(true);
  };

  const handleCreateBalance = () => {
    setSelectedBalance(undefined);
    setBalanceDialogMode("create");
    setBalanceDialogOpen(true);
  };

  const handleBalanceClick = (balance: PointsBalance) => {
    setSelectedBalance(balance);
    setBalanceDialogMode("edit");
    setBalanceDialogOpen(true);
  };

  const handleCreateOperation = () => {
    setSelectedOperation(undefined);
    setOperationDialogMode("create");
    setOperationDialogOpen(true);
  };

  const handleOperationClick = (operation: PointsOperation) => {
    setSelectedOperation(operation);
    setOperationDialogMode("edit");
    setOperationDialogOpen(true);
  };

  const handleCreateOffer = () => {
    setSelectedOffer(undefined);
    setOfferDialogMode("create");
    setOfferDialogOpen(true);
  };

  const handleOfferClick = (offer: PointsOffer) => {
    setSelectedOffer(offer);
    setOfferDialogMode("edit");
    setOfferDialogOpen(true);
  };

  const stats = useMemo(() => {
    const totalPrograms = programs.length;
    const programsWithLinkedAccounts = programs.filter(
      (p) => p.linkedAccounts && p.linkedAccounts.length > 0,
    ).length;
    const uniqueProgramTypes = new Set(programs.map((p) => p.program)).size;

    const activeBalances = balances.filter((b) => b.status === "active");
    const totalPoints = activeBalances.reduce((sum, b) => sum + b.points, 0);

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const expiringIn30Days = activeBalances
      .filter((b) => b.expiresAt >= now && b.expiresAt <= now + thirtyDays)
      .reduce((sum, b) => sum + b.points, 0);

    return {
      totalPrograms,
      programsWithLinkedAccounts,
      uniqueProgramTypes,
      totalPoints,
      expiringIn30Days,
      activeBalancesCount: activeBalances.length,
    };
  }, [programs, balances]);

  if (programsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              {tCommon("error")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {programsError instanceof Error
                ? programsError.message
                : tCommon("error")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ExportButton
              data={programs}
              columns={pointsProgramColumns}
              filename="pontos"
              module="points"
              disabled={programsLoading}
            />
            <Button variant="outline" onClick={handleCreateOffer}>
              <Plus className="size-4" />
              {t("actions.newOffer")}
            </Button>
            <Button variant="outline" onClick={handleCreateOperation}>
              <Plus className="size-4" />
              {t("actions.newOperation")}
            </Button>
            <Button variant="outline" onClick={handleCreateBalance}>
              <Plus className="size-4" />
              {t("actions.newBalance")}
            </Button>
            <Button onClick={handleCreateProgram}>
              <Plus className="size-4" />
              {t("actions.newProgram")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.totalPoints")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatPoints(stats.totalPoints)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Coins className="size-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.totalPrograms")}
                </p>
                <p className="text-3xl font-bold text-chart-2">
                  {stats.totalPrograms}
                </p>
              </div>
              <div className="p-3 rounded-full bg-chart-2/10">
                <Star className="size-6 text-chart-2" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.activeBalances")}
                </p>
                <p className="text-3xl font-bold text-chart-3">
                  {stats.activeBalancesCount}
                </p>
              </div>
              <div className="p-3 rounded-full bg-chart-3/10">
                <TrendingUp className="size-6 text-chart-3" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("stats.expiringIn30Days")}
                </p>
                <p className="text-3xl font-bold text-destructive">
                  {formatPoints(stats.expiringIn30Days)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>

        {stats.expiringIn30Days > 0 && (
          <div className="mb-8">
            <ExpirationAlerts
              balances={balances}
              programs={programs}
              onBalanceClick={handleBalanceClick}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="programs" className="gap-2">
              <Star className="size-4" />
              {t("tabs.programs")}
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2">
              <Coins className="size-4" />
              {t("tabs.balances")}
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <History className="size-4" />
              {t("tabs.operations")}
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <Gift className="size-4" />
              {t("tabs.offers")}
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="size-4" />
              {t("tabs.calculator")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <PointsProgramsTable
              programs={programs}
              accounts={accounts}
              isLoading={programsLoading}
              onProgramClick={handleProgramClick}
            />
          </TabsContent>

          <TabsContent value="balances">
            <PointsBalancesTable
              balances={balances}
              programs={programs}
              isLoading={balancesLoading}
              onBalanceClick={handleBalanceClick}
            />
          </TabsContent>

          <TabsContent value="operations">
            <PointsOperationsTable
              operations={operations}
              programs={programs}
              isLoading={operationsLoading}
              onOperationClick={handleOperationClick}
            />
          </TabsContent>

          <TabsContent value="offers">
            <PointsOffersTable
              offers={offers}
              isLoading={offersLoading}
              onOfferClick={handleOfferClick}
            />
          </TabsContent>

          <TabsContent value="calculator">
            <div className="max-w-lg">
              <PointsCalculator />
            </div>
          </TabsContent>
        </Tabs>

        <PointsProgramFormDialog
          open={programDialogOpen}
          onOpenChange={setProgramDialogOpen}
          program={selectedProgram}
          accounts={accounts}
          mode={programDialogMode}
        />

        <PointsBalanceFormDialog
          open={balanceDialogOpen}
          onOpenChange={setBalanceDialogOpen}
          balance={selectedBalance}
          programs={programs}
          mode={balanceDialogMode}
        />

        <PointsOperationFormDialog
          open={operationDialogOpen}
          onOpenChange={setOperationDialogOpen}
          operation={selectedOperation}
          programs={programs}
          mode={operationDialogMode}
        />

        <PointsOfferFormDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          offer={selectedOffer}
          mode={offerDialogMode}
        />
      </div>
    </div>
  );
}
