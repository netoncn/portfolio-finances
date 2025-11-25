# Firestore Security Rules - Detailed Documentation

This document provides comprehensive documentation of the Firestore security rules for the Finance AI application.

## Table of Contents

1. [Overview](#overview)
2. [Helper Functions](#helper-functions)
3. [Collections](#collections)
4. [Security Principles](#security-principles)
5. [Testing](#testing)

## Overview

The security rules follow these core principles:
- **User Isolation**: Users can only access their own data
- **Reference Integrity**: Foreign key references are validated
- **Immutability**: Critical fields cannot be changed after creation
- **Field Validation**: Data types and constraints are enforced
- **Explicit Permissions**: All operations require explicit allow rules

## Helper Functions

### Authentication Helpers

```javascript
function isSignedIn()
```
Returns true if user is authenticated.

```javascript
function isAdmin()
```
Returns true if user has admin custom claim.

```javascript
function isOwnerId(uid)
```
Returns true if authenticated user's UID matches the provided UID.

```javascript
function isOwnerDoc()
```
Returns true if the existing document's `userId` matches the authenticated user's UID.

```javascript
function isOwnerNew()
```
Returns true if the new/updated document's `userId` matches the authenticated user's UID.

```javascript
function sameUserIdOnUpdate()
```
Ensures `userId` is immutable during updates.

### Reference Validation Helpers

```javascript
function accountBelongsToUser(accountId)
```
Validates that the referenced account exists and belongs to the authenticated user.
**Performance Note**: Makes a `get()` call, counts toward read quota.

```javascript
function invAccountBelongsToUser(invAccountId)
```
Validates that the referenced investment account belongs to the authenticated user.

```javascript
function pointsProgramBelongsToUser(programId)
```
Validates that the referenced points program belongs to the authenticated user.

## Collections

### Users (`/users/{uid}`)

**Purpose**: User profile and settings

**Rules**:
- **Create**: User can create their own profile (`uid` must match `auth.uid`)
- **Read/Update**: User can only access their own profile
- **Delete**: Disabled (users cannot delete their profile)

**Why Delete is Disabled**: Prevents accidental data loss. User deletion should be handled through admin functions.

---

### Accounts (`/accounts/{id}`)

**Purpose**: Financial accounts (credit cards, bank accounts, wallets)

**Validation Functions**:

1. `isValidAccountType(type)`: Validates account type
   - Allowed: `card_credit`, `card_debit`, `prepaid`, `wallet_cash`, `bank_checking`, `bank_savings`

2. `isValidCardBrand(brand)`: Validates card brand
   - Allowed: `visa`, `mastercard`, `amex`, `elo`, `hipercard`, `vr`, `sodexo`, `alelo`, `other`

3. `hasRequiredAccountFields(data)`: Validates required fields
   - `userId` (string)
   - `name` (string, min 2 chars)
   - `accountType` (valid type)
   - `currency` (must be "BRL")
   - `createdAt` (int timestamp)
   - `updatedAt` (int timestamp)
   - `archived` (boolean)

4. `accountFieldsAreCoherent(data)`: Validates field consistency
   - Cards must have `cardBrand`
   - Credit cards must have `billing` with `closingDay`, `dueDay`
   - Bank accounts/wallets must NOT have `billing` or `cardBrand`
   - `last4` must be 2-4 digits if present

**Immutable Fields**: `userId`, `createdAt`

**Rules**:
- **Create**: Must be owner, valid fields, coherent data
- **Read**: Owner only
- **Update**: Owner only, immutable fields unchanged, valid fields
- **Delete**: Owner only

---

### Transactions (`/transactions/{id}`)

**Purpose**: Financial transactions (expenses, income, transfers)

**Validation Functions**:

1. `isValidTransactionType(type)`: Validates transaction type
   - Allowed: `expense`, `income`, `transfer`

2. `isValidTransactionStatus(status)`: Validates transaction status
   - Allowed: `pending`, `posted`, `paid`, `canceled`

3. `hasRequiredTransactionFields(data)`: Validates required fields
   - Core: `userId`, `accountId`, `date`, `description`, `amount`, `type`, `status`
   - Denormalized: `accountType` (required)
   - Optional: `categoryId`, `merchant`, `tags`, `installmentGroupId`, `installmentNumber`, `installmentCount`, `statementMonth`

**Immutable Fields**: `userId`, `createdAt`, `date`

**Reference Validation**: `accountId` must belong to user

**Rules**:
- **Create**: Must be owner, valid account reference, valid fields
- **Read**: Owner only
- **Update**: Owner only, immutable fields unchanged, valid account reference, valid fields
- **Delete**: Owner only

**Why `date` is Immutable**: Prevents manipulation of transaction history after creation. To change date, delete and recreate.

---

### Installment Groups (`/installment_groups/{id}`)

**Purpose**: Groups of installment transactions (e.g., 12x payment)

**Validation Functions**:

1. `hasRequiredInstallmentGroupFields(data)`: Validates required fields
   - `userId`, `description`, `totalAmount`, `installmentCount`
   - `installmentCount` must be between 2 and 120
   - Optional: `accountId`, `startDate`

**Immutable Fields**: `userId`, `createdAt`, `installmentCount`

**Rules**:
- **Create**: Must be owner, valid fields
- **Read**: Owner only
- **Update**: Owner only, immutable fields unchanged, valid fields
- **Delete**: Owner only

**Why `installmentCount` is Immutable**: Changing the number of installments after creation would invalidate related transactions.

---

### Statements (`/statements/{id}`)

**Purpose**: Credit card statements/invoices

**Validation Functions**:

1. `isValidStatementStatus(status)`: Validates statement status
   - Allowed: `open`, `closed`, `paid`

2. `hasRequiredStatementFields(data)`: Validates required fields
   - Core: `userId`, `accountId`, `statementMonth`, `closingDate`, `dueDate`, `status`, `totalAmount`, `minimumPayment`
   - `statementMonth` must be 6 characters (YYYYMM format)
   - Optional: `paidAmount`, `paidAt`, `transactionIds`

**Immutable Fields**: `userId`, `createdAt`, `accountId`, `statementMonth`

**Reference Validation**: `accountId` must belong to user

**Rules**:
- **Create**: Must be owner, valid account reference, valid fields
- **Read**: Owner only
- **Update**: Owner only, immutable fields unchanged, valid account reference, valid fields
- **Delete**: Owner only

---

### Categories (`/categories/{id}`)

**Purpose**: Transaction categories for classification

**Validation Functions**:

1. `isValidCategoryType(type)`: Validates category type
   - Allowed: `expense`, `income`, `transfer`

2. `hasRequiredCategoryFields(data)`: Validates required fields
   - `userId`, `name` (1-100 chars), `type`
   - Optional: `icon`, `color` (#RRGGBB format), `parentId`, `keywords` (max 50), `budgetLimit`, `isSystem`, `order`

**Rules**:
- **Create**: Must be owner, valid fields
- **Read**: Owner only
- **Update**: Owner only, valid fields
- **Delete**: Owner only

---

### Mapping Rules (`/mapping_rules/{id}`)

**Purpose**: Auto-classification rules for transactions

**Validation Functions**:

1. `isValidRulePriority(priority)`: Validates rule priority
   - Allowed: `low`, `medium`, `high`

2. `hasRequiredMappingRuleFields(data)`: Validates required fields
   - Core: `userId`, `name` (1-100 chars), `conditions` (1-10 items), `actions` (1-5 items), `priority`, `enabled`
   - Optional: `description`, `categoryType`, `usageCount`, `lastUsedAt`

**Rules**:
- **Create**: Must be owner, valid fields
- **Read**: Owner only
- **Update**: Owner only, valid fields
- **Delete**: Owner only

---

### Budgets, Goals, Insights

**Purpose**: Financial planning and analytics

**Rules**:
- **Create**: Must be owner
- **Read**: Owner only
- **Update**: Owner only, `userId` immutable
- **Delete**: Owner only

**Note**: Full field validation to be added when schemas are finalized.

---

### Investments Collections

Collections: `investment_accounts`, `investment_positions`, `investment_transactions`, `investment_earnings`

**Rules**:
- **Create**: Must be owner, valid `invAccountId` reference
- **Read**: Owner only
- **Update**: Owner only, `userId` immutable, valid `invAccountId` reference
- **Delete**: Owner only

---

### Points/Loyalty Collections

Collections: `points_programs`, `points_balances`, `points_operations`

**Rules**:
- **Create**: Must be owner, valid `programId` reference (where applicable)
- **Read**: Owner only
- **Update**: Owner only, `userId` immutable, valid `programId` reference
- **Delete**: Owner only

**Special Case - Points Offers** (`/points_offers/{id}`):
- **Read**: Public (no authentication required)
- **Create/Update/Delete**: Admin only

---

### Audit Events (`/audit_events/{id}`)

**Purpose**: Audit trail for system actions

**Rules**:
- **Read**: Owner can read their own audit events
- **Create**: Disabled (only admin SDK can create)
- **Update**: Disabled (immutable)
- **Delete**: Disabled (only admin SDK can cleanup)

**Why These Restrictions**: Audit events must be tamper-proof. Only the system (via admin SDK) can create them, and users cannot modify or delete them.

---

## Security Principles

### 1. Defense in Depth

Multiple layers of validation:
1. Authentication check
2. Ownership verification
3. Reference validation
4. Field type validation
5. Business rule validation

### 2. Fail-Safe Defaults

- All operations are denied by default
- Explicit `allow` rules must be specified
- Missing fields or invalid data cause rejection

### 3. Immutability Where Critical

Fields that shouldn't change:
- `userId`: Prevents ownership transfer
- `createdAt`: Prevents backdating
- `date` (transactions): Prevents history manipulation
- `installmentCount`: Prevents orphaned installments
- `statementMonth`: Prevents statement reassignment

### 4. Reference Integrity

Foreign keys are validated:
- Transactions reference valid accounts
- Statements reference valid credit card accounts
- Investment operations reference valid investment accounts
- Points operations reference valid programs

**Cost Consideration**: Each `get()` call counts as a document read. Design your application to minimize unnecessary writes that trigger these validations.

### 5. Type Safety

All fields have type constraints:
- Strings have min/max length
- Numbers are validated for range
- Enums are checked against allowed values
- Timestamps are integers (milliseconds since epoch)
- Lists have size limits

---

## Testing

### Unit Testing Security Rules

Use the Firebase Emulator Suite:

```bash
firebase emulators:start --only firestore
```

Create test file `firestore.rules.test.ts`:

```typescript
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

describe("Transactions Security Rules", () => {
  it("should allow user to read their own transactions", async () => {
    const db = getFirestore("user123");
    const ref = db.collection("transactions").doc("tx1");
    await assertSucceeds(ref.get());
  });

  it("should deny user from reading other user's transactions", async () => {
    const db = getFirestore("user456");
    const ref = db.collection("transactions").doc("tx1"); // belongs to user123
    await assertFails(ref.get());
  });
});
```

### Manual Testing Checklist

Test each collection:
- [ ] Create with valid data
- [ ] Create with invalid data (should fail)
- [ ] Create with another user's `userId` (should fail)
- [ ] Read own documents
- [ ] Read other user's documents (should fail)
- [ ] Update with valid data
- [ ] Update immutable fields (should fail)
- [ ] Update with invalid references (should fail)
- [ ] Delete own documents
- [ ] Delete other user's documents (should fail)

### Common Test Scenarios

1. **Cross-User Access**
   - User A creates a transaction
   - User B tries to read it → Should fail
   - User B tries to update it → Should fail
   - User B tries to delete it → Should fail

2. **Invalid References**
   - Create transaction with non-existent `accountId` → Should fail
   - Create transaction with another user's `accountId` → Should fail

3. **Immutability**
   - Create transaction with `userId: "user123"`
   - Try to update `userId` to "user456" → Should fail
   - Try to update `createdAt` → Should fail
   - Try to update `date` → Should fail

4. **Field Validation**
   - Create account with `accountType: "invalid"` → Should fail
   - Create transaction with negative `amount` → Should pass (valid for refunds)
   - Create category with `name` > 100 chars → Should fail

---

## Deployment

Deploy security rules:

```bash
pnpm deploy:rules
```

**Important**: Always test rules in development environment before deploying to production.

---

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause**: User doesn't have access to the requested resource.

**Check**:
1. Is user authenticated?
2. Does document belong to user?
3. Are all required fields present?
4. Are all field types correct?

### Error: "Error performing get()"

**Cause**: Reference validation failed (account doesn't exist or doesn't belong to user).

**Check**:
1. Does the referenced account exist?
2. Does it belong to the authenticated user?
3. Is the account ID correct?

### Performance Issues

**Symptom**: Slow writes

**Cause**: Multiple `get()` calls for reference validation

**Solution**:
1. Minimize writes when possible
2. Batch related operations
3. Consider denormalization to avoid references

---

## Best Practices

1. **Always include `userId`**: Every document must have a `userId` field
2. **Use immutable fields**: Mark critical fields as immutable
3. **Validate references**: Check foreign keys before accepting writes
4. **Enforce types**: Validate field types and constraints
5. **Test thoroughly**: Use emulator for testing before deployment
6. **Document rules**: Keep this documentation updated
7. **Monitor logs**: Check Firebase logs for security rule violations
8. **Principle of least privilege**: Only grant necessary permissions
