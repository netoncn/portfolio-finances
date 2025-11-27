import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReviewQueueList } from "@/components/reviews/ReviewQueueList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReviewsPage() {
  const t = useTranslations("reviews");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="pending">{t("tabs.pending")}</TabsTrigger>
          <TabsTrigger value="approved">{t("tabs.approved")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("tabs.rejected")}</TabsTrigger>
          <TabsTrigger value="skipped">{t("tabs.skipped")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <ReviewQueueList status="pending" />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <ReviewQueueList status="approved" />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <ReviewQueueList status="rejected" />
        </TabsContent>

        <TabsContent value="skipped" className="mt-6">
          <ReviewQueueList status="skipped" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
