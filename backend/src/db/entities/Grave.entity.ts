import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, OneToMany, CreateDateColumn } from "typeorm"; 
import { Organisation } from "./Organisation.entity.ts";
import { ActiveInactiveStatus } from "../enums.ts";
import { DeadPerson } from "./DeadPerson.entity.ts";
import { Suggestion } from "./Suggestion.entity.ts";

@Entity("grave")
export class Grave {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255, nullable: true })
  name?: string;

  @Column("varchar", { length: 255, nullable: true })
  block?: string;

  @Column("varchar", { length: 255, nullable: true })
  lot?: string;

  @Column("text", { nullable: true })
  address?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @Column("varchar", { length: 255, nullable: true })
  state?: string;

  @Column("int", { nullable: true }) 
  totalgraves?: number;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;
  
  @OneToMany(() => DeadPerson, (deadPerson) => deadPerson.grave)
  deadPerson?: DeadPerson | null;

  @ManyToOne(() => Organisation, (organisation) => organisation.graves, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;

  @OneToMany(() => Suggestion, (suggestions) => suggestions.grave)
  suggestions!: Suggestion[];

  @CreateDateColumn ({ name: "createdat" })
  createdat!: Date;
}