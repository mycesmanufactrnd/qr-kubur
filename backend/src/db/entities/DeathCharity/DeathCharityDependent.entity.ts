import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { DeathCharityMember } from "./DeathCharityMember.entity.ts";

@Entity("deathcharitydependent")
export class DeathCharityDependent {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => DeathCharityMember, (deathcharitymember) => deathcharitymember.dependents, {
    nullable: true,
    onDelete: "SET NULL",
  })
  member?: DeathCharityMember | null;

  @Column("varchar", { length: 255 })
  fullname!: string;

  @Column("varchar", { length: 255 })
  relationship!: string; // spouse / child

  @Column("varchar", { length: 255 })
  icnumber!: string;
}
