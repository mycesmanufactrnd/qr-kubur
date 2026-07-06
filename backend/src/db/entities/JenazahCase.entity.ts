// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Mosque } from "./Mosque.entity.js";
import { JenazahCaseStatus } from "../enums.js";

@Entity("jenazahcase")
export class JenazahCase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer", { nullable: true })
  mosqueId?: number | null;

  @ManyToOne(() => Mosque, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "mosqueId" })
  mosque?: Mosque | null;

  @Column("integer", { nullable: true })
  qariahmemberid?: number | null;

  @Column("jsonb")
  details!: Record<string, any>;

  @Column({
    type: "enum",
    enum: JenazahCaseStatus,
    default: JenazahCaseStatus.PENDING,
  })
  status!: JenazahCaseStatus;

  @Column("boolean", { default: false })
  isapproved!: boolean;

  @Column("text", { nullable: true })
  userremarks?: string | null;

  @Column("text", { nullable: true })
  adminremarks?: string | null;

  @Column("text", { nullable: true })
  deathconfirmationphotourl?: string | null;
  
  @Column("text", { nullable: true })
  policereportphotourl?: string | null;

  @Column("text", { nullable: true })
  supportingdocphotourl?: string | null;

  @Column("boolean", { default: false })
  addedtoqariah!: boolean;

  @CreateDateColumn()
  createdat!: Date;
}
