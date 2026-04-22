import { z } from "zod";
import { router, protectedProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { GanttChart } from "../db/entities.ts";

const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["done", "in-progress", "upcoming"]),
});

const projectInputSchema = z.object({
  title: z.string().min(1),
  colorId: z.string().default("emerald"),
  startDate: z.string(),
  durationWeeks: z.number().int().min(1),
  tasks: z.array(taskSchema).default([]),
});

export const ganttchartRouter = router({
  getAll: protectedProcedure.query(async () => {
    const repo = AppDataSource.getRepository(GanttChart);
    return repo.find({ order: { createdat: "ASC" } });
  }),

  create: protectedProcedure
    .input(projectInputSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(GanttChart);
      return repo.save(repo.create(input));
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: projectInputSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(GanttChart);
      const project = await repo.findOneByOrFail({ id: input.id });
      repo.merge(project, input.data);
      return repo.save(project);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(GanttChart);
      return repo.delete(input);
    }),
});
