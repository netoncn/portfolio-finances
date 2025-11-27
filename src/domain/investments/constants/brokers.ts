export interface Broker {
  id: string;
  name: string;
  country: "BR" | "US" | "OTHER";
  logo?: string;
}

export const BRAZILIAN_BROKERS: Broker[] = [
  { id: "xp", name: "XP Investimentos", country: "BR" },
  { id: "clear", name: "Clear Corretora", country: "BR" },
  { id: "rico", name: "Rico", country: "BR" },
  { id: "inter", name: "Inter Invest", country: "BR" },
  { id: "nuinvest", name: "Nu Invest", country: "BR" },
  { id: "btg", name: "BTG Pactual", country: "BR" },
  { id: "modal", name: "Modal", country: "BR" },
  { id: "itau", name: "Itaú", country: "BR" },
  { id: "bradesco", name: "Bradesco", country: "BR" },
  { id: "santander", name: "Santander", country: "BR" },
  { id: "safra", name: "Safra", country: "BR" },
  { id: "c6", name: "C6 Bank", country: "BR" },
  { id: "avenue", name: "Avenue", country: "BR" },
  { id: "genial", name: "Genial Investimentos", country: "BR" },
  { id: "easynvest", name: "Easynvest", country: "BR" },
  { id: "ativa", name: "Ativa Investimentos", country: "BR" },
  { id: "mirae", name: "Mirae Asset", country: "BR" },
  { id: "orama", name: "Órama", country: "BR" },
  { id: "terra", name: "Terra Investimentos", country: "BR" },
  { id: "guide", name: "Guide Investimentos", country: "BR" },
];

export const INTERNATIONAL_BROKERS: Broker[] = [
  { id: "interactive", name: "Interactive Brokers", country: "US" },
  { id: "charles_schwab", name: "Charles Schwab", country: "US" },
  { id: "fidelity", name: "Fidelity", country: "US" },
  { id: "td_ameritrade", name: "TD Ameritrade", country: "US" },
  { id: "etrade", name: "E*TRADE", country: "US" },
  { id: "vanguard", name: "Vanguard", country: "US" },
  { id: "robinhood", name: "Robinhood", country: "US" },
  { id: "webull", name: "Webull", country: "US" },
  { id: "tastyworks", name: "tastyworks", country: "US" },
  { id: "merrill", name: "Merrill Edge", country: "US" },
];

export const CRYPTO_EXCHANGES: Broker[] = [
  { id: "binance", name: "Binance", country: "OTHER" },
  { id: "coinbase", name: "Coinbase", country: "US" },
  { id: "kraken", name: "Kraken", country: "US" },
  { id: "gemini", name: "Gemini", country: "US" },
  { id: "mercado_bitcoin", name: "Mercado Bitcoin", country: "BR" },
  { id: "foxbit", name: "Foxbit", country: "BR" },
  { id: "novadax", name: "NovaDAX", country: "BR" },
  { id: "bitso", name: "Bitso", country: "OTHER" },
];

export const ALL_BROKERS: Broker[] = [
  ...BRAZILIAN_BROKERS,
  ...INTERNATIONAL_BROKERS,
  ...CRYPTO_EXCHANGES,
].sort((a, b) => a.name.localeCompare(b.name));

export function getBrokerById(id: string): Broker | undefined {
  return ALL_BROKERS.find((broker) => broker.id === id);
}

export function getBrokersByCountry(country: "BR" | "US" | "OTHER"): Broker[] {
  return ALL_BROKERS.filter((broker) => broker.country === country);
}
