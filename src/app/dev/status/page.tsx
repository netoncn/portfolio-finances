"use client";

import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  Cloud,
  Cpu,
  Database,
  HardDrive,
  Info,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useClearLogs,
  useDevLogs,
  useDevStatus,
  useHealthCheck,
} from "@/hooks/use-dev-status";
import type { LogLevel } from "@/lib/dev-logger";
import { cn } from "@/lib/utils";

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "bg-slate-500",
  info: "bg-blue-500",
  warn: "bg-yellow-500",
  error: "bg-red-500",
};

const LOG_LEVEL_TEXT_COLORS: Record<LogLevel, string> = {
  debug: "text-slate-600 dark:text-slate-400",
  info: "text-blue-600 dark:text-blue-400",
  warn: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
};

export default function DevStatusPage() {
  const [logLevel, setLogLevel] = useState<LogLevel | "all">("all");
  const [logSearch, setLogSearch] = useState("");

  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useDevStatus();
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useHealthCheck();
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useDevLogs({
    level: logLevel === "all" ? undefined : logLevel,
    search: logSearch || undefined,
    limit: 100,
  });
  const clearLogsMutation = useClearLogs();

  const handleClearLogs = async () => {
    try {
      await clearLogsMutation.mutateAsync();
      toast.success("Logs cleared successfully");
    } catch {
      toast.error("Failed to clear logs");
    }
  };

  const handleRefreshAll = () => {
    refetchStatus();
    refetchHealth();
    refetchLogs();
    toast.success("Data refreshed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Bug className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Dev Status & Logs
              </h1>
              <p className="text-slate-400">
                System monitoring for development
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="bg-orange-500/20 text-orange-400 border-orange-500/50"
            >
              Development Only
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefreshAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-slate-700"
            >
              <Server className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-slate-700"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="data-[state=active]:bg-slate-700"
            >
              <Cloud className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className="data-[state=active]:bg-slate-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <Skeleton className="h-24 bg-slate-700" />
                ) : health ? (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {health.status === "healthy" ? (
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      ) : (
                        <XCircle className="h-12 w-12 text-red-500" />
                      )}
                      <div>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            health.status === "healthy"
                              ? "text-green-500"
                              : "text-red-500",
                          )}
                        >
                          {health.status.toUpperCase()}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {health.service}
                        </p>
                      </div>
                    </div>
                    <div className="h-12 w-px bg-slate-700" />
                    <div>
                      <p className="text-slate-400 text-sm">Environment</p>
                      <p className="text-white font-medium">
                        {health.environment}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Version</p>
                      <p className="text-white font-medium">{health.version}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Uptime</p>
                      <p className="text-white font-medium">
                        {Math.floor(health.uptime / 60)}m{" "}
                        {Math.floor(health.uptime % 60)}s
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">Failed to load health status</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <Skeleton className="h-16 bg-slate-700" />
                    </CardContent>
                  </Card>
                ))
              ) : status ? (
                <>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Uptime</p>
                          <p className="text-white font-semibold">
                            {status.runtime.uptimeFormatted}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <HardDrive className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Heap Used</p>
                          <p className="text-white font-semibold">
                            {status.runtime.memoryUsage.heapUsed}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Cpu className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Node Version</p>
                          <p className="text-white font-semibold">
                            {status.runtime.nodeVersion}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Server className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Platform</p>
                          <p className="text-white font-semibold">
                            {status.runtime.platform} ({status.runtime.arch})
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>

            {status && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Heap Used</p>
                      <p className="text-white font-medium">
                        {status.runtime.memoryUsage.heapUsed}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Heap Total</p>
                      <p className="text-white font-medium">
                        {status.runtime.memoryUsage.heapTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">External</p>
                      <p className="text-white font-medium">
                        {status.runtime.memoryUsage.external}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">RSS</p>
                      <p className="text-white font-medium">
                        {status.runtime.memoryUsage.rss}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Application Logs
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {logsData?.stats.total || 0} total logs in memory
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={logLevel}
                      onValueChange={(v) => setLogLevel(v as LogLevel | "all")}
                    >
                      <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warn</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Search logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-48 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleClearLogs}
                      disabled={clearLogsMutation.isPending}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsData?.stats && (
                  <div className="flex gap-4 mb-4 pb-4 border-b border-slate-700">
                    {(["debug", "info", "warn", "error"] as LogLevel[]).map(
                      (level) => (
                        <div key={level} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              LOG_LEVEL_COLORS[level],
                            )}
                          />
                          <span className="text-slate-400 text-sm capitalize">
                            {level}
                          </span>
                          <span className="text-white font-medium">
                            {logsData.stats.byLevel[level]}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-sm">
                  {logsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 bg-slate-700" />
                      ))}
                    </div>
                  ) : logsData?.logs.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      No logs to display
                    </p>
                  ) : (
                    logsData?.logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            LOG_LEVEL_COLORS[log.level],
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "text-xs font-medium uppercase",
                                LOG_LEVEL_TEXT_COLORS[log.level],
                              )}
                            >
                              {log.level}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.source && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-slate-700/50 border-slate-600 text-slate-300"
                              >
                                {log.source}
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-300 break-words">
                            {log.message}
                          </p>
                          {log.context &&
                            Object.keys(log.context).length > 0 && (
                              <pre className="mt-2 p-2 bg-slate-950 rounded text-xs text-slate-400 overflow-x-auto">
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statusLoading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <Skeleton className="h-32 bg-slate-700" />
                    </CardContent>
                  </Card>
                ))
              ) : status ? (
                <>
                  {/* Firebase */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Database className="h-5 w-5 text-orange-500" />
                        Firebase
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status</span>
                          {status.services.firebase.configured ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Configured
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                              Not Configured
                            </Badge>
                          )}
                        </div>
                        {status.services.firebase.projectId && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Project ID</span>
                            <span className="text-white font-mono text-sm">
                              {status.services.firebase.projectId}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Authentication
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status</span>
                          {status.services.auth.configured ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Configured
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                              Not Configured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Provider</span>
                          <span className="text-white capitalize">
                            {status.services.auth.provider}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        AI / LLM
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Status</span>
                          {status.services.ai.enabled ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        {status.services.ai.provider && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Provider</span>
                            <span className="text-white capitalize">
                              {status.services.ai.provider}
                            </span>
                          </div>
                        )}
                        {status.services.ai.model && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Model</span>
                            <span className="text-white font-mono text-sm">
                              {status.services.ai.model}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Quota</span>
                          {status.services.ai.quotaEnabled ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Current feature configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <Skeleton className="h-32 bg-slate-700" />
                ) : status ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-white font-medium">AI Features</p>
                          <p className="text-slate-400 text-sm">
                            Enable AI-powered features
                          </p>
                        </div>
                      </div>
                      {status.features.aiFeatures ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-white font-medium">
                            Firebase Emulator
                          </p>
                          <p className="text-slate-400 text-sm">
                            Use local Firebase emulator
                          </p>
                        </div>
                      </div>
                      {status.features.firebaseEmulator ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-white font-medium">
                            NextAuth Debug
                          </p>
                          <p className="text-slate-400 text-sm">
                            Enable authentication debug logs
                          </p>
                        </div>
                      </div>
                      {status.features.nextAuthDebug ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {status && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Environment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">NODE_ENV</p>
                      <Badge
                        className={cn(
                          status.environment.isDevelopment
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                            : "bg-green-500/20 text-green-400 border-green-500/50",
                        )}
                      >
                        {status.environment.nodeEnv}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">APP_ENV</p>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                        {status.environment.appEnv}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Is Development</p>
                      <span className="text-white">
                        {status.environment.isDevelopment ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Is Production</p>
                      <span className="text-white">
                        {status.environment.isProduction ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
