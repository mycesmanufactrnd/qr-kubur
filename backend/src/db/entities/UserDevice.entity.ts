import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity.ts";

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
