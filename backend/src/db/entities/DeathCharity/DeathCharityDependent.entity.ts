import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.ts";
import { DeathCharityClaim } from "./DeathCharityClaim.entity.ts";
import { AuditableEntity } from "../ExtendsEntity/AuditableEntity.ts";

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
