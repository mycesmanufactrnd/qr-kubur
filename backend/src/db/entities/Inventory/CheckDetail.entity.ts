// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { CheckDetailResult } from "../../enums.js";
import { CheckSession } from "./CheckSession.entity.js";
import { InventoryItem } from "./InventoryItem.entity.js";

@Entity("check_detail")
export class CheckDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column("integer")
  sessionId!: number;

  @ManyToOne(() => CheckSession, (session) => session.details, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "sessionId" })
  session!: CheckSession;

  @Column("integer")
  itemId!: number;

  @ManyToOne(() => InventoryItem, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "itemId" })
  item!: InventoryItem;

  // Snapshot of current_quantity at the moment the session was created.
  @Column("int")
  system_quantity!: number;

  // Null until the auditor physically counts and saves the row.
  @Column("int", { nullable: true })
  physical_count?: number | null;

  // physical_count − system_quantity, computed and stored on updateCount.
  @Column("int", { nullable: true })
  difference?: number | null;

  @Column({
    type: "enum",
    enum: CheckDetailResult,
    nullable: true,
  })
  result?: CheckDetailResult | null;

  @Column("text", { nullable: true })
  notes?: string | null;
}
