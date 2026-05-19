//@ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity.js";

@Entity("userdevice")
export class UserDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", unique: true })
  fcmToken: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn()
  user: User | null;

  @CreateDateColumn()
  createdat: Date;
}
