# Firestore Indexes

This document describes the composite indexes configured for the Finance AI application.

## Overview

Firestore composite indexes are required when queries use:
- Multiple equality filters
- Inequality filters combined with orderBy
- Multiple orderBy clauses

## Accounts Indexes

### 1. User Active Accounts by Creation Date
```
userId (ASC) + archived (ASC) + createdAt (DESC)
```
**Usage**: List all active/archived accounts for a user, ordered by creation date

## Transactions Indexes

### 1. User Transactions by Date
```
userId (ASC) + date (DESC)
```
**Usage**: List all transactions for a user, ordered by transaction date

### 2. Account Transactions by Date
```
userId (ASC) + accountId (ASC) + date (DESC)
```
**Usage**: Filter transactions by specific account, ordered by date

### 3. Account Type Transactions by Date
```
userId (ASC) + accountType (ASC) + date (DESC)
```
**Usage**: Filter transactions by account type (e.g., all credit card transactions)

### 4. Card Brand Transactions by Date
```
userId (ASC) + cardBrand (ASC) + date (DESC)
```
**Usage**: Filter transactions by card brand (e.g., all Visa transactions)

### 5. Account Type + Card Brand Transactions by Date
```
userId (ASC) + accountType (ASC) + cardBrand (ASC) + date (DESC)
```
**Usage**: Combined filter (e.g., all Visa credit card transactions)

### 6. Installment Group Transactions
```
userId (ASC) + installmentGroupId (ASC) + installmentNumber (ASC)
```
**Usage**: List all transactions in an installment group, ordered by installment number

### 7. Statement Transactions by Date
```
userId (ASC) + statementMonth (ASC) + date (DESC)
```
**Usage**: List all transactions in a specific statement month (YYYYMM format)

### 8. Category Transactions by Date
```
userId (ASC) + categoryId (ASC) + date (DESC)
```
**Usage**: Filter transactions by category, ordered by date

## Installment Groups Indexes

### 1. User Installment Groups by Creation Date
```
userId (ASC) + createdAt (DESC)
```
**Usage**: List all installment groups for a user, ordered by creation date

## Statements Indexes

### 1. Account Statements by Month
```
userId (ASC) + accountId (ASC) + statementMonth (DESC)
```
**Usage**: List all statements for a credit card account, ordered by statement month

### 2. Account Statements by Status and Due Date
```
userId (ASC) + accountId (ASC) + status (ASC) + dueDate (ASC)
```
**Usage**: Filter statements by status (open/closed/paid) and find overdue statements

## Categories Indexes

### 1. User Categories by Type and Name
```
userId (ASC) + type (ASC) + name (ASC)
```
**Usage**: List categories filtered by type (expense/income/transfer), alphabetically sorted

## Mapping Rules Indexes

### 1. Active Rules by Priority and Creation Date
```
userId (ASC) + enabled (ASC) + priority (DESC) + createdAt (DESC)
```
**Usage**: Query enabled rules sorted by priority (high → medium → low) and creation date for auto-classification

## Audit Events Indexes

### 1. Resource Audit Trail
```
userId (ASC) + resourceId (ASC) + timestamp (DESC)
```
**Usage**: Get audit history for a specific resource

### 2. User Audit Trail
```
userId (ASC) + timestamp (DESC)
```
**Usage**: Get all audit events for a user, ordered by timestamp

## Deployment

To deploy indexes to Firebase:

```bash
pnpm deploy:indexes
```

This will update the indexes in the Firebase project. Note that index creation can take several minutes.

## Monitoring

Monitor index status in the Firebase Console:
- Project Console → Firestore Database → Indexes
- Check for "Building" or "Error" states
- Indexes must be in "Enabled" state for queries to work

## Performance Considerations

1. **Index Size**: Each composite index increases storage requirements
2. **Write Performance**: More indexes = slower writes (minimal impact for this use case)
3. **Read Performance**: Properly indexed queries are extremely fast
4. **Cost**: Indexes count toward storage quota but are negligible for typical usage

## Query Optimization Tips

1. **Avoid array-contains with other filters**: Requires special index configuration
2. **Limit inequality filters**: Only one field can have inequality per query
3. **OrderBy must match inequality field**: If using `>`, `<`, `>=`, `<=`, the first orderBy must be that field
4. **Test queries in development**: Firestore will suggest required indexes in console errors
