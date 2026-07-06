// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Mosque } from "../Mosque.entity.js";

@Entity("qariahdevice")
export class QariahDevice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { unique: true })
  fcmQariahToken!: string;

  @Column("varchar", { length: 255 })
  icnumber!: string;
  
  @Column("integer", { nullable: true })
  mosqueId?: number | null;

  @ManyToOne(() => Mosque, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "mosqueId" })
  mosque?: Mosque | null;

  @Column("boolean", { default: false })
  isapproved!: boolean;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
