// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { User } from "../User.entity.js";
import { CheckSessionStatus } from "../../enums.js";
import { CheckDetail } from "./CheckDetail.entity.js";

@Entity("check_session")
export class CheckSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("timestamptz", { default: () => "NOW()" })
  session_date!: Date;

  @Column("integer")
  checkedById!: number;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "checkedById" })
  checkedBy!: User;

  @Column("varchar", { length: 255 })
  location!: string;

  @Column({
    type: "enum",
    enum: CheckSessionStatus,
    default: CheckSessionStatus.IN_PROGRESS,
  })
  status!: CheckSessionStatus;

  @Column("int", { default: 0 })
  total_items!: number;

  @Column("int", { default: 0 })
  matched!: number;

  @Column("int", { default: 0 })
  missing!: number;

  @Column("int", { default: 0 })
  over_count!: number;

  @Column("text", { nullable: true })
  notes?: string | null;

  @OneToMany(() => CheckDetail, (detail) => detail.session, {
    cascade: true,
  })
  details?: any[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
