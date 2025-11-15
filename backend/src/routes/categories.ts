import { Hono } from "hono";
import { type AppType } from "../types";
import { db } from "../db";

const app = new Hono<AppType>();

// Default categories that come pre-loaded
const DEFAULT_CATEGORIES = [
  { id: "sales", name: "Sales", description: "Sales challenges and pitches", color: "orange", isCustom: false },
  { id: "social", name: "Social", description: "Social interactions and networking", color: "blue", isCustom: false },
  { id: "entrepreneurship", name: "Entrepreneurship", description: "Business and startup challenges", color: "purple", isCustom: false },
  { id: "dating", name: "Dating", description: "Dating and relationships", color: "pink", isCustom: false },
  { id: "confidence", name: "Confidence", description: "Building self-confidence", color: "gold", isCustom: false },
  { id: "career", name: "Career", description: "Professional development", color: "green", isCustom: false },
];

/**
 * GET /api/categories
 * Get all categories (default + custom user categories)
 */
app.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Get custom user categories from database (if we add a categories table later)
    // For now, just return the default categories
    const categories = DEFAULT_CATEGORIES;

    return c.json({
      categories,
    });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return c.json(
      {
        error: "Failed to fetch categories",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * POST /api/categories
 * Create a new custom category
 */
app.post("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return c.json({ error: "Category name is required" }, 400);
    }

    // For now, we'll return success but not actually store custom categories
    // This can be implemented later with a database table
    console.log("📁 [Categories] Creating custom category:", name);

    // Generate a unique ID
    const categoryId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return c.json({
      success: true,
      category: {
        id: categoryId,
        name: name.trim(),
        description: description?.trim() || "",
        color: "purple",
        isCustom: true,
      },
    });
  } catch (error) {
    console.error("❌ Error creating category:", error);
    return c.json(
      {
        error: "Failed to create category",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * PUT /api/categories/:id
 * Update a custom category
 */
app.put("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const categoryId = c.req.param("id");
    const body = await c.req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return c.json({ error: "Category name is required" }, 400);
    }

    // Check if trying to update a default category
    if (!categoryId.startsWith("custom-")) {
      return c.json({ error: "Cannot update default categories" }, 403);
    }

    console.log("📝 [Categories] Updating category:", categoryId);

    return c.json({
      success: true,
      category: {
        id: categoryId,
        name: name.trim(),
        description: description?.trim() || "",
        color: "purple",
        isCustom: true,
      },
    });
  } catch (error) {
    console.error("❌ Error updating category:", error);
    return c.json(
      {
        error: "Failed to update category",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a custom category
 */
app.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const categoryId = c.req.param("id");

    // Check if trying to delete a default category
    if (!categoryId.startsWith("custom-")) {
      return c.json({ error: "Cannot delete default categories" }, 403);
    }

    console.log("🗑️  [Categories] Deleting category:", categoryId);

    return c.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    return c.json(
      {
        error: "Failed to delete category",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export { app as categoriesRouter };
