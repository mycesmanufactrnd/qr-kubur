// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from "typeorm";
import { Mosque } from "./Mosque.entity.js";

@Entity("mosqueorganisationchart")
export class MosqueOrganisationChart {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Mosque, (mosque) => mosque.organisationcharts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  mosque?: Mosque | null;

  @Column("varchar", { length: 255 })
  team!: string;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 50, nullable: true })
  phoneno?: string;

  @Column("varchar", { length: 255, nullable: true })
  designation?: string;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
