import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { createCategorySchema } from "@/domain/categories/schemas/category.schema";
import { CategoryService } from "@/domain/categories/services/category.service";
import type { Category } from "@/domain/categories/types/category";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let categories: Category[];
    if (type) {
      categories = await CategoryService.listByUserAndType(
        session.user.id,
        type,
      );
    } else {
      categories = await CategoryService.listByUser(session.user.id);
    }

    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (error) {
    logger.error(
      "Error listing categories",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validatedData = createCategorySchema.parse({
      ...body,
      userId: session.user.id,
    });

    const category = await CategoryService.create(validatedData);

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    logger.error(
      "Error creating category",
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
