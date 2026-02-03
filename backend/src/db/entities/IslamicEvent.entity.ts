import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "islamicevents" })
export class IslamicEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "enum", enum: ["Event", "Fasting", "Prayer", "Hajj"] })
  category!: "Event" | "Fasting" | "Prayer" | "Hajj";

  @Column({ type: "int" })
  hijrimonth!: number;

  @Column({ type: "int" })
  hijriday!: number;

  @Column({ type: "boolean", default: true })
  isrecurring!: boolean;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "text", nullable: true })
  virtue?: string;

  @Column({ type: "simple-array", nullable: true })
  recommendedamal?: string[];

  @Column({ type: "varchar", length: 255, nullable: true })
  quranreference?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  hadithreference?: string;

  @Column({ type: "boolean", default: true })
  isactive!: boolean;

  @Column({ type: "int", default: 1 })
  reminderdaysbefore!: number;
}
