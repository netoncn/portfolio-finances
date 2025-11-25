export function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function capitalizeLine(line: string): string {
  return line.split(" ").map(capitalizeWord).join(" ");
}

export function capitalizeSentence(sentence: string): string {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function formatCurrency(
  valueInCents: number | string,
  currency: string,
  locale: string = "pt-BR",
): string {
  let numericValue: number;

  if (typeof valueInCents !== "number") {
    numericValue = parseFloat(valueInCents);
    if (Number.isNaN(numericValue)) return "";
  } else {
    numericValue = valueInCents;
  }

  const valueInBaseUnit = numericValue / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(valueInBaseUnit);
}

export const getInitials = (name: string) => {
  if (name.includes(" ") || name.includes("-")) {
    name = name
      .split(/[\s-]+/)
      .slice(0, 2)
      .join(" ");
  }
  if (!name) return "US";
  if (name.length === 1) return name.toUpperCase();
  if (name.includes(" ")) {
    return name.charAt(0).toUpperCase() + name.charAt(1).toUpperCase();
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
