// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  DeleteDateColumn,
  JoinColumn,
} from "typeorm";
import { Organisation } from "./Organisation.entity.js";
import { TahfizCenter } from "./TahfizCenter.entity.js";
import { Permission } from "./Permission.entity.js";
import { Mosque } from "./Mosque.entity.js";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  fullname!: string;

  @Column("varchar", { unique: true, nullable: true })
  username!: string;

  @Column("varchar", { nullable: true })
  email?: string;

  @Column("varchar", { nullable: true })
  phoneno?: string;

  @Column("varchar", { nullable: true })
  password!: string;

  @Column("varchar", { length: 20, nullable: true })
  role!: string;

  @ManyToOne(() => Organisation, (organisation) => organisation.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;

  @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  tahfizcenter?: TahfizCenter | null;

  @OneToMany(() => Permission, (permissions) => permissions.user)
  permissions!: Permission[];

  @Column("text", { array: true, nullable: true })
  states?: string[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @DeleteDateColumn({ name: "deletedat" })
  deletedat?: Date | null;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
