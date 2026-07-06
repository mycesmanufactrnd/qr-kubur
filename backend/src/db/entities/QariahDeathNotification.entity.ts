// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharity/DeathCharityMember.entity.js";
import { Organisation } from "./Organisation.entity.js";

@Entity("qariahdeathnotification")
export class QariahDeathNotification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer", { nullable: true })
  deceasedMemberId?: number | null;

  @ManyToOne(() => DeathCharityMember, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "deceasedMemberId" })
  deceasedMember?: DeathCharityMember | null;

  @Column("integer", { nullable: true })
  organisationId?: number | null;

  @ManyToOne(() => Organisation, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organisationId" })
  organisation?: Organisation | null;

  @Column("text")
  message!: string;

  @Column("integer", { default: 0 })
  notifiedcount!: number;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
