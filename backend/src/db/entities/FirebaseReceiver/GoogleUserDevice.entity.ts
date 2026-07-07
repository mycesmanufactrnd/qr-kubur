// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { GoogleUser } from "../GoogleUser/GoogleUser.entity.js";

@Entity("googleuserdevice")
export class GoogleUserDevice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { unique: true })
  fcmGoogleToken!: string;

  @ManyToOne(() => GoogleUser, { nullable: true, onDelete: "CASCADE" })
  googleuser?: GoogleUser | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
