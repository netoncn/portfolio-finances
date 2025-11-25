"use client";

import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useState } from "react";
import LocaleSwitcher from "../base/LocaleSwitcher";
import ThemeToggle from "../base/ThemeToggle";

interface HeaderProps {
  session?: Session | undefined | null;
}

export default function Header({ session }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (!session) {
    return null;
  }

  return (
    <header className="shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-color">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-xl font-bold hidden sm:block">
                Finance AI
              </span>
            </Link>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/accounts"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Contas
            </Link>
            <Link
              href="/transactions"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Transações
            </Link>
          </div>

          {/* Perfil do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <button
              type="button"
              className="relative p-2 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <ThemeToggle />

            <LocaleSwitcher />

            {/* Dropdown do Perfil */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "Usuário"}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-gray-200 hover:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="font-semibold">
                      {session?.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs">Ver perfil</p>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 border border-gray-100 bg-color">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs truncate">{session?.user?.email}</p>
                  </div>

                  <Link href="/perfil" className={"block px-4 py-2 text-sm"}>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Meu Perfil
                    </div>
                  </Link>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Mobile Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:text-blue-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <Link href="/dashboard" className="block py-2 hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/accounts" className="block py-2 hover:text-blue-600">
              Contas
            </Link>
            <Link
              href="/transactions"
              className="block py-2 hover:text-blue-600"
            >
              Transações
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
