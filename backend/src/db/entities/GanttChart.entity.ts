import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export interface GanttTask {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: "done" | "in-progress" | "upcoming";
}

@Entity("ganttproject")
export class GanttChart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  title!: string;

  @Column("varchar", { length: 50, default: "emerald" })
  colorId!: string;

  @Column("varchar", { length: 20 })
  startDate!: string;

  @Column("integer", { default: 12 })
  durationWeeks!: number;

  @Column("jsonb", { default: [] })
  tasks!: GanttTask[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
