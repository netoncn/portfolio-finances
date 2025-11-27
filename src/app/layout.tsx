import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import I18nProvider from "@/components/base/i18nProvider";
import Providers from "@/components/base/Providers";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { QuickActionsButton } from "@/components/layout/QuickActionsButton";
import { authOptions } from "@/lib/auth";
import "@/config/validate-env";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="pt-BR" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <Providers>
          <I18nProvider>
            <Header session={session} />
            <main className="flex-1">{children}</main>
            <Footer />
            {session && <QuickActionsButton />}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
