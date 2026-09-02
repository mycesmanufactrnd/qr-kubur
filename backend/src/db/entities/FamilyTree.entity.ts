// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { GoogleUser } from "./GoogleUser/GoogleUser.entity.js";
import { DeadPerson } from "./DeadPerson.entity.js";

@Entity("familytree")
export class FamilyTree {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer")
  googleuserId!: number;

  @ManyToOne(() => GoogleUser, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "googleuserId" })
  googleuser!: GoogleUser;

  @Column("integer")
  deadpersonId!: number;

  @ManyToOne(() => DeadPerson, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "deadpersonId" })
  deadperson!: DeadPerson;

  @Column("varchar", { length: 50 })
  relation!: string;

  @Column("varchar", { length: 255, nullable: true })
  relationother?: string | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
