import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { GoogleUser } from "./GoogleUser.entity.ts";

@Entity("googleuserdevice")
export class GoogleUserDevice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { unique: true })
  fcmToken!: string;

  @ManyToOne(() => GoogleUser, { nullable: true, onDelete: "CASCADE" })
  googleuser?: GoogleUser | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
