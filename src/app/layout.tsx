import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { getServerSession } from "next-auth";
import I18nProvider from "@/components/base/i18nProvider";
import Providers from "@/components/base/Providers";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { QuickActionsButton } from "@/components/layout/QuickActionsButton";
import { authOptions } from "@/lib/auth";
import "@/config/validate-env";
import "@/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finance AI - Controle Financeiro Inteligente",
  description: "Gerencie suas finanças com o poder da Inteligência Artificial",
  keywords: [
    "finanças",
    "controle financeiro",
    "IA",
    "inteligência artificial",
    "orçamento",
    "investimentos",
  ],
  authors: [{ name: "Finance AI Team" }],
  openGraph: {
    title: "Finance AI - Controle Financeiro Inteligente",
    description:
      "Gerencie suas finanças com o poder da Inteligência Artificial",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Ir para o conteúdo principal
        </a>
        <Providers>
          <I18nProvider>
            <Header session={session} />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            {session && <QuickActionsButton />}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
