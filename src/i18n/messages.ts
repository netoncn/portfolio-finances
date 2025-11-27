interface Messages {
  [key: string]: string | string[] | Messages;
}

export const messagesMap: Record<string, () => Promise<{ default: Messages }>> =
  {
    "pt-BR": () => import("../messages/pt-BR.json"),
    en: () => import("../messages/en.json"),
  };
