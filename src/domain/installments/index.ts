// Converters
export * from "./converters/installment-group.converter";

// DTOs (inferred from schemas)
export type {
  CreateInstallmentGroupDTO,
  InstallmentGroupDTO,
  UpdateInstallmentGroupDTO,
} from "./dto/installment-group.dto";
// Helpers
export type {
  DistributionStrategy,
  GenerateInstallmentsConfig,
  InstallmentData,
} from "./helpers/installment-calculation.helper";
export {
  calculateInstallmentDueDate,
  calculateInstallmentTotal,
  calculateStatementMonth,
  distributeAmountEqually,
  distributeWithStrategy,
  generateInstallments,
  validateInstallmentTotals,
} from "./helpers/installment-calculation.helper";
// Schemas
export {
  createInstallmentGroupSchema,
  installmentGroupSchema,
  installmentPlanEnum,
  updateInstallmentGroupSchema,
} from "./schemas/installment-group.schema";
export type {
  GenerateInstallmentTransactionsConfig,
  GenerateInstallmentTransactionsResult,
} from "./services/installment-generation.service";
export { InstallmentGenerationService } from "./services/installment-generation.service";
// Services
export * from "./services/installment-group.service";
export type {
  CancelInstallmentsOptions,
  CancelInstallmentsResult,
  UpdateInstallmentGroupOptions,
  UpdateInstallmentGroupResult,
} from "./services/installment-update.service";
export { InstallmentUpdateService } from "./services/installment-update.service";

// Types
export type {
  InstallmentGroup,
  InstallmentPlan,
} from "./types/installment-group";
