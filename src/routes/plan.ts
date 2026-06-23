import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import generateTrainingPlan from "../lib/ai";
import { formatPlanResponse, formatPlanHistory } from "../lib/formatResponse";

export const planRouter = Router();

planRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return (res.status(400).json({ error: "User ID is required" }));
    }

    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      return (res
        .status(400)
        .json({ error: "User profile not found . Complete onboarding first" })
      );
    }

    // NEED THE PLAN TABLE
    const latestPlan = await prisma.training_plans.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: { version: true },
    });

    const newVersion = latestPlan ? latestPlan.version + 1 : 1;
    let planJson;

    try {
      planJson = await generateTrainingPlan(profile);

    } catch (error) {
      console.error("AI generation failed:", error);
      return (res.status(500).json({
        error: "Failed to generate training plan. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      }));
    }

    const planText = JSON.stringify(planJson, null, 2);

    const newPlan = await prisma.training_plans.create({
      data: {
        user_id: userId,
        plan_json: planJson as any,
        plan_text: planText,
        version: newVersion,
      }
    });
    
    res.json(formatPlanResponse(newPlan));

  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

planRouter.get("/current", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return (res.status(400).json({ error: "User ID is required" }));
    }

    const plan = await prisma.training_plans.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    if (!plan) {
      return (res.status(404).json({ error: "No plan found" }));
    }
    
    res.json(formatPlanResponse(plan));

  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

planRouter.get("/history", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return (res.status(400).json({ error: "User ID required" }));
    }

    const planHistory = await prisma.training_plans.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: { id: true, version: true, created_at: true },
    });

    if (planHistory.length === 0) {
      return (res.status(404).json({ error: "No plans found" }));
    }

    res.json(planHistory.map(formatPlanHistory));
    
  } catch (error) {
    console.error("Error fetching plan history:", error);
    res.status(500).json({ error: "Failed to fetch plan history" });
  }
});

planRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const id = req.params.id as string;

    if (!userId) {
      return (res.status(400).json({ error: "User ID required" }));
    }

    const plan = await prisma.training_plans.findFirst({
      where: { id, user_id: userId },
    });

    if (!plan) {
      return (res.status(404).json({ error: "Plan not found" }));
    }

    res.json(formatPlanResponse(plan));

  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});
