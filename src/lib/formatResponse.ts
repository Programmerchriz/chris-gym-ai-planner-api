export function formatPlanResponse(plan: any) {
  const planJson = plan.plan_json;

  const weeklySchedule = Array.isArray(planJson.weeklySchedule)
    ? planJson.weeklySchedule.map((day: any) => ({
        day: day.day || "Day",
        focus: day.focus || "Full Body",
        exercises: Array.isArray(day.exercises)
          ? day.exercises
          : Array.isArray(day.exercise)
            ? day.exercise
            : [],
      }))
    : [];

  return {
    id: plan.id,
    userId: plan.user_id,
    overview: planJson.overview,
    weeklySchedule,
    progression: planJson.progression,
    version: plan.version,
    createdAt: plan.created_at,
  };
}

export function formatPlanHistory(plan: any) {
  return {
    id: plan.id,
    version: plan.version,
    createdAt: plan.created_at,
  };
}