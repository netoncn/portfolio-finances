import { PrivacyService } from "./privacy.service";

export function exampleBasicSanitization() {
  console.log("\n=== Example 1: Basic Text Sanitization ===\n");

  const text = "Meu CPF é 123.456.789-00 e meu email é joao.silva@example.com";

  const result = PrivacyService.sanitizeText(text);

  console.log("Original:", result.original);
  console.log("Sanitized:", result.sanitized);
  console.log("Detected Types:", result.detectedTypes);
  console.log("Modified:", result.modified);
}

export function exampleTransactionSanitization() {
  console.log("\n=== Example 2: Transaction Sanitization ===\n");

  const transaction = {
    description:
      "Pagamento para Dr. Carlos - CPF: 987.654.321-00 - Consulta médica",
    merchant: "Clínica XYZ - Tel: (11) 98765-4321",
    tags: ["saúde", "consulta"],
  };

  const result = PrivacyService.sanitizeTransaction(transaction);

  console.log("Original Description:", transaction.description);
  console.log("Sanitized Description:", result.description);
  console.log("Original Merchant:", transaction.merchant);
  console.log("Sanitized Merchant:", result.merchant);
  console.log("Detected Types:", result.privacyLog.detectedTypes);
}

export function exampleChatMessageSanitization() {
  console.log("\n=== Example 3: Chat Message Sanitization ===\n");

  const message = {
    content:
      "Olá! Meu número de telefone é (11) 98765-4321 e meu email é user@test.com. Quanto gastei em restaurantes?",
    role: "user" as const,
  };

  const result = PrivacyService.sanitizeChatMessage(message);

  console.log("Original:", message.content);
  console.log("Sanitized:", result.content);
  console.log("Detected Types:", result.privacyLog.detectedTypes);
}

export function exampleRedlineDetection() {
  console.log("\n=== Example 4: Redline Detection ===\n");

  const text =
    "Minha senha é password: supersecreto123 e meu token é token: abc-xyz-789";

  const result = PrivacyService.sanitizeText(text);

  console.log("Original:", result.original);
  console.log("Sanitized:", result.sanitized);
  console.log("Redline Violations:", result.redlineViolations);
}

export function exampleTruncation() {
  console.log("\n=== Example 5: Truncation ===\n");

  const longText =
    "Esta é uma descrição extremamente longa que contém muitos detalhes desnecessários sobre uma transação que poderia ser muito mais concisa e direta ao ponto mas continua explicando coisas que não são relevantes para a análise financeira e acabam ocupando muito espaço.";

  const result = PrivacyService.sanitizeText(longText, {
    maxDescriptionLength: 80,
  });

  console.log("Original Length:", result.original.length);
  console.log("Sanitized Length:", result.sanitized.length);
  console.log("Truncated:", result.sanitized);
}

export function exampleMultipleSensitiveData() {
  console.log("\n=== Example 6: Multiple Sensitive Data Types ===\n");

  const text =
    "Cliente: João Silva\n" +
    "CPF: 123.456.789-00\n" +
    "Email: joao@example.com\n" +
    "Telefone: (11) 98765-4321\n" +
    "Cartão: 1234 5678 9012 3456\n" +
    "Endereço: Rua das Flores, 123";

  const result = PrivacyService.sanitizeText(text);

  console.log("Original:\n", result.original);
  console.log("\nSanitized:\n", result.sanitized);
  console.log("\nDetected Types:", result.detectedTypes);
  console.log("Total Types Detected:", result.detectedTypes.length);
}

export function exampleCustomConfiguration() {
  console.log("\n=== Example 7: Custom Configuration ===\n");

  const text = "CPF: 123.456.789-00 - Email: user@test.com";

  const partialResult = PrivacyService.sanitizeText(text, {
    maskingLevel: "partial",
  });

  const fullResult = PrivacyService.sanitizeText(text, {
    maskingLevel: "full",
  });

  console.log("Original:", text);
  console.log("Partial Masking:", partialResult.sanitized);
  console.log("Full Masking:", fullResult.sanitized);
}

export function exampleBatchSanitization() {
  console.log("\n=== Example 8: Batch Transaction Sanitization ===\n");

  const transactions = [
    {
      description: "Transferência para CPF: 123.456.789-00",
      merchant: "PIX",
    },
    {
      description: "Compra no cartão final 3456",
      merchant: "Amazon",
    },
    {
      description: "Pagamento para user@example.com",
      merchant: "PayPal",
    },
  ];

  const results = PrivacyService.sanitizeTransactionsBatch(transactions);

  results.forEach((result, index) => {
    console.log(`\nTransaction ${index + 1}:`);
    console.log("Original:", transactions[index].description);
    console.log("Sanitized:", result.description);
    console.log(
      "Detected:",
      result.privacyLog.detectedTypes.length > 0
        ? result.privacyLog.detectedTypes.join(", ")
        : "None",
    );
  });
}

export function exampleCreditCardDetection() {
  console.log("\n=== Example 9: Credit Card Detection ===\n");

  const cardNumbers = [
    "1234 5678 9012 3456",
    "1234-5678-9012-3456",
    "1234567890123456",
  ];

  cardNumbers.forEach((card) => {
    const result = PrivacyService.sanitizeText(`Cartão: ${card}`);
    console.log("Original:", card);
    console.log("Sanitized:", result.sanitized);
  });
}

export function exampleAddressSanitization() {
  console.log("\n=== Example 10: Address Sanitization ===\n");

  const addresses = [
    "Rua das Flores, 123",
    "Av. Paulista, 1000",
    "Alameda Santos 456A",
    "Praça da Sé 789",
  ];

  addresses.forEach((address) => {
    const result = PrivacyService.sanitizeText(address);
    console.log("Original:", address);
    console.log("Sanitized:", result.sanitized);
  });
}

export function runAllExamples() {
  console.log("\n🛡️  PRIVACY SYSTEM EXAMPLES\n");
  console.log("=".repeat(60));

  exampleBasicSanitization();
  exampleTransactionSanitization();
  exampleChatMessageSanitization();
  exampleRedlineDetection();
  exampleTruncation();
  exampleMultipleSensitiveData();
  exampleCustomConfiguration();
  exampleBatchSanitization();
  exampleCreditCardDetection();
  exampleAddressSanitization();

  console.log(`\n${"=".repeat(60)}`);
  console.log("\n✅ All examples completed!\n");
}

// Uncomment to run examples:
// runAllExamples();
