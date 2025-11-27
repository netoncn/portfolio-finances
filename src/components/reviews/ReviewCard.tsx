"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input";
import type { Category } from "@/domain/categories/types/category";
import type { TransactionReview } from "@/domain/transactions";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency } from "@/lib/utils";

interface ReviewCardProps {
  review: TransactionReview;
  onApprove: (data: {
    categoryId?: string;
    merchant?: string;
    tags?: string[];
    notes?: string;
    createRule?: boolean;
  }) => Promise<void>;
  onReject: (data: {
    categoryId?: string;
    merchant?: string;
    tags?: string[];
    notes?: string;
    improveSuggestion?: boolean;
  }) => Promise<void>;
  onSkip: () => Promise<void>;
}

export function ReviewCard({
  review,
  onApprove,
  onReject,
  onSkip,
}: ReviewCardProps) {
  const t = useTranslations("reviews");
  const [expanded, setExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customCategory, setCustomCategory] = useState(
    review.suggestedCategoryId || "",
  );
  const [customMerchant, setCustomMerchant] = useState(
    review.suggestedMerchant || "",
  );
  const [customTags, setCustomTags] = useState<string[]>(
    review.suggestedTags || [],
  );
  const [notes, setNotes] = useState("");
  const [createRule, setCreateRule] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const { transaction } = review;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const selectedCategory = categories.find(
    (c: Category) => c.id === customCategory,
  );

  const handleQuickApprove = async () => {
    try {
      setIsProcessing(true);
      await onApprove({
        categoryId: review.suggestedCategoryId,
        merchant: review.suggestedMerchant,
        tags: review.suggestedTags,
        createRule,
      });
      toast.success(t("messages.approveSuccess"));
    } catch (_error) {
      toast.error(t("messages.approveError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomApprove = async () => {
    if (!customCategory) {
      toast.error(t("messages.categoryRequired"));
      return;
    }

    try {
      setIsProcessing(true);
      await onApprove({
        categoryId: customCategory,
        merchant: customMerchant || review.suggestedMerchant,
        tags: customTags,
        notes,
        createRule,
      });
      toast.success(t("messages.customApproveSuccess"));
    } catch (_error) {
      toast.error(t("messages.approveError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await onReject({
        categoryId: customCategory,
        merchant: customMerchant,
        tags: customTags,
        notes,
        improveSuggestion: true,
      });
      toast.success(t("messages.rejectSuccess"));
    } catch (_error) {
      toast.error(t("messages.rejectError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsProcessing(true);
      await onSkip();
      toast.info(t("messages.skipSuccess"));
    } catch (_error) {
      toast.error(t("messages.skipError"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{transaction.description}</h3>
              <Badge className={getPriorityColor(review.priority)}>
                {review.priority}
              </Badge>
              {review.suggestionSource === "ai" && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatCurrency(transaction.amount)}</span>
              <span>{new Date(transaction.date).toLocaleDateString()}</span>
              <span className={getConfidenceColor(review.suggestionConfidence)}>
                {(review.suggestionConfidence * 100).toFixed(0)}%{" "}
                {t("card.confidence")}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium">{t("card.suggested")}</p>
            </div>
            <div className="space-y-1 text-sm">
              {review.suggestedCategoryId && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t("card.category")}
                  </span>
                  <Badge variant="outline">
                    {categories.find(
                      (c: Category) => c.id === review.suggestedCategoryId,
                    )?.name || review.suggestedCategoryId}
                  </Badge>
                </div>
              )}
              {review.suggestedMerchant && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t("card.merchantName")}
                  </span>
                  <span className="font-medium">
                    {review.suggestedMerchant}
                  </span>
                </div>
              )}
              {review.suggestedTags && review.suggestedTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground">
                    {t("card.tags")}
                  </span>
                  {review.suggestedTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {review.suggestionReason && (
                <p className="text-muted-foreground italic mt-2 pt-2 border-t">
                  {review.suggestionReason}
                </p>
              )}
            </div>
          </div>

          {expanded && (
            <div className="space-y-4 pt-3 border-t">
              <div>
                <Label htmlFor={`category-${review.id}`}>
                  {t("card.categoryLabel")}
                </Label>
                <Select
                  value={customCategory}
                  onValueChange={setCustomCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("card.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        {t("card.loading")}
                      </SelectItem>
                    ) : (
                      categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("card.typeLabel")} {selectedCategory.type}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`merchant-${review.id}`}>
                  {t("card.merchantLabel")}
                </Label>
                <Input
                  id={`merchant-${review.id}`}
                  value={customMerchant}
                  onChange={(e) => setCustomMerchant(e.target.value)}
                  placeholder={t("card.enterMerchant")}
                />
              </div>

              <div>
                <Label>{t("card.tagsLabel")}</Label>
                <TagsInput value={customTags} onChange={setCustomTags} />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("card.addTags")}
                </p>
              </div>

              <div>
                <Label htmlFor={`notes-${review.id}`}>
                  {t("card.reviewNotes")}
                </Label>
                <Input
                  id={`notes-${review.id}`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("card.addNotes")}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                <input
                  type="checkbox"
                  id={`create-rule-${review.id}`}
                  checked={createRule}
                  onChange={(e) => setCreateRule(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor={`create-rule-${review.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span>{t("card.createRuleLabel")}</span>
                  </div>
                </Label>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!expanded ? (
              <Button
                onClick={handleQuickApprove}
                size="sm"
                className="flex-1"
                disabled={isProcessing}
              >
                <Check className="h-4 w-4 mr-1" />
                {isProcessing ? t("card.processing") : t("card.quickApprove")}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCustomApprove}
                  size="sm"
                  className="flex-1"
                  disabled={isProcessing || !customCategory}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isProcessing ? t("card.processing") : t("card.applyChanges")}
                </Button>
                <Button
                  onClick={handleReject}
                  size="sm"
                  variant="destructive"
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("actions.reject")}
                </Button>
              </>
            )}

            <Button
              onClick={handleSkip}
              size="sm"
              variant="outline"
              disabled={isProcessing}
            >
              {t("actions.skip")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
