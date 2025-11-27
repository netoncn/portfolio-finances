import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/firestore.admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const snapshot = await adminDb
      .collection("categories")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        message: "No categories found",
        migrated: 0,
      });
    }

    const categoriesToMigrate = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return typeof data.order !== "number";
    });

    if (categoriesToMigrate.length === 0) {
      return NextResponse.json({
        message: "All categories already have order field",
        total: snapshot.docs.length,
        migrated: 0,
      });
    }

    const batch = adminDb.batch();
    let order = 0;

    for (const doc of categoriesToMigrate) {
      batch.update(doc.ref, {
        order,
        updatedAt: Date.now(),
      });
      order++;
    }

    await batch.commit();

    logger.info(
      `Migrated ${categoriesToMigrate.length} categories for user ${userId}`,
    );

    return NextResponse.json({
      message: "Migration completed successfully",
      total: snapshot.docs.length,
      migrated: categoriesToMigrate.length,
    });
  } catch (error) {
    logger.error(
      "Error migrating categories",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
