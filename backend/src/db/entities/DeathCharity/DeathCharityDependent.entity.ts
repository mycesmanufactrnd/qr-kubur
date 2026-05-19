// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.js";
import { DeathCharityClaim } from "./DeathCharityClaim.entity.js";
import { AuditableEntity } from "../ExtendsEntity/AuditableEntity.js";

@Entity("deathcharitydependent")
export class DeathCharityDependent extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => DeathCharityMember, (deathcharitymember) => deathcharitymember.dependents, {
    nullable: true,
    onDelete: "SET NULL",
  })
  member?: DeathCharityMember | null;

  @OneToMany(() => DeathCharityClaim, (claims) => claims.dependent)
  claims?: DeathCharityClaim[];

  @Column("varchar", { length: 255 })
  fullname!: string;

  @Column("varchar", { length: 255 })
  relationship!: string; // spouse / child

  @Column("varchar", { length: 255 })
  icnumber!: string;
}
