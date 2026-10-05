//@ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "../User.entity.js";

@Entity("userdevice")
export class UserDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", unique: true })
  fcmToken: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn()
  user: User | null;

  // "web" | "android" | "ios" — null for rows saved before this column existed.
  // Lets the same admin be logged in on both the website and the native app
  // without getting duplicate pushes for one event: when both exist for the
  // same user, the native one wins. See firebase.service.ts's pickBestTokensPerUser.
  @Column({ type: "varchar", nullable: true })
  platform?: string | null;

  @CreateDateColumn()
  createdat: Date;
}
