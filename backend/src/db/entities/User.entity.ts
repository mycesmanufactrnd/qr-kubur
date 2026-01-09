import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Organisation } from "./Organisation.entity.ts";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { Permission } from "./Permission.entity.ts";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  fullname!: string;

  @Column("varchar", { unique: true, nullable: true })
  email!: string;

  @Column("varchar", { nullable: true })
  phoneno?: string;

  @Column("varchar", { nullable: true })
  password!: string;

  @Column("varchar", { length: 20, nullable: true })
  role!: string;

  @ManyToOne(() => Organisation, (organisation) => organisation.user, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;

  @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.user, {
    nullable: true,
    onDelete: "SET NULL",
  })
  tahfizcenter?: TahfizCenter | null;

  @OneToMany(() => Permission, (permission) => permission.user)
  permission!: Permission[];

  @Column("text", { array: true, nullable: true })
  states?: string[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
