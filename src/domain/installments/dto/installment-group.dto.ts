import type { z } from "zod";
import type {
  createInstallmentGroupSchema,
  installmentGroupSchema,
  updateInstallmentGroupSchema,
} from "../schemas/installment-group.schema";

export type CreateInstallmentGroupDTO = z.infer<
  typeof createInstallmentGroupSchema
>;

export type UpdateInstallmentGroupDTO = z.infer<
  typeof updateInstallmentGroupSchema
>;

export type InstallmentGroupDTO = z.infer<typeof installmentGroupSchema>;
