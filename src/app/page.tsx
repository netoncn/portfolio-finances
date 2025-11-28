import {
  ArrowRight,
  BarChart3,
  Bot,
  CreditCard,
  PiggyBank,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export const revalidate = 3600; // ISR: 1 hora

export default async function HomePage() {
  const t = await getTranslations();

  const features = [
    {
      icon: CreditCard,
      title: t("features.accounts.title"),
      description: t("features.accounts.description"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: BarChart3,
      title: t("features.transactions.title"),
      description: t("features.transactions.description"),
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: PiggyBank,
      title: t("features.budgets.title"),
      description: t("features.budgets.description"),
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: TrendingUp,
      title: t("features.investments.title"),
      description: t("features.investments.description"),
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: Bot,
      title: t("features.ai.title"),
      description: t("features.ai.description"),
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Trophy,
      title: t("features.points.title"),
      description: t("features.points.description"),
      gradient: "from-indigo-500 to-blue-500",
    },
  ];

  const stats = [
    { value: "10k+", label: t("hero.stats.users") },
    { value: "1M+", label: t("hero.stats.transactions") },
    { value: "30%", label: t("hero.stats.savings") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-accent/10 blur-3xl" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              {t("hero.subtitle")}
            </div>

            {/* Title */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                {t("hero.title").split(" ").slice(0, -1).join(" ")}
              </span>{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t("hero.title").split(" ").slice(-1)}
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t("hero.description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="group gap-2 px-8 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                <Link href="/auth/signin">
                  {t("hero.cta.primary")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="backdrop-blur-sm"
              >
                <Link href="#features">{t("hero.cta.secondary")}</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="text-4xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-muted-foreground/30 p-1">
            <div className="mx-auto h-2 w-1 animate-pulse rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/20 to-background" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("features.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-card hover:shadow-xl"
                >
                  {/* Gradient border effect on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                  />

                  {/* Icon */}
                  <div
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span>{t("hero.learnMore")}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-8 sm:p-12">
            <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Shield className="h-10 w-10" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                  {t("hero.security.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("hero.security.description")}
                </p>
              </div>
              <div className="shrink-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  256-bit SSL
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("hero.cta.ready")}
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            {t("hero.cta.readyDescription")}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="group gap-2 px-8 shadow-lg shadow-primary/25"
            >
              <Link href="/auth/signin">
                {t("hero.cta.primary")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="#features">{t("hero.cta.secondary")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
