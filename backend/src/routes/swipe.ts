import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createSwipeRequestSchema,
  type CreateSwipeResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const swipeRouter = new Hono<AppType>();

// ============================================
// POST /api/swipe - Create a swipe
// ============================================
swipeRouter.post("/", zValidator("json", createSwipeRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { swipedId, direction } = c.req.valid("json");

  // Create the swipe
  await db.swipe.create({
    data: {
      swiperId: user.id,
      swipedId,
      direction,
    },
  });

  // Check if this creates a match
  // A match occurs when both users swiped left (yes) on each other
  if (direction === "left") {
    const reciprocalSwipe = await db.swipe.findFirst({
      where: {
        swiperId: swipedId,
        swipedId: user.id,
        direction: "left",
      },
    });

    if (reciprocalSwipe) {
      // Create match
      const match = await db.match.create({
        data: {
          user1Id: user.id,
          user2Id: swipedId,
        },
      });

      return c.json({
        success: true,
        matched: true,
        matchId: match.id,
      } satisfies CreateSwipeResponse);
    }
  }

  return c.json({
    success: true,
    matched: false,
    matchId: null,
  } satisfies CreateSwipeResponse);
});

export { swipeRouter };
