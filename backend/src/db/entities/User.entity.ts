import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Organisation } from "./Organisation.entity.ts";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { Permission } from "./Permission.entity.ts";
import { Mosque } from "./Mosque.entity.ts";

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

  @ManyToOne(() => Mosque, (mosque) => mosque.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  mosque?: Mosque | null;

  @OneToMany(() => Permission, (permissions) => permissions.user)
  permissions!: Permission[];

  @Column("text", { array: true, nullable: true })
  states?: string[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
