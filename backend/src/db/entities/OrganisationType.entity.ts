import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Unique } from "typeorm";
import { Organisation } from "./Organisation.entity.ts";
import { ActiveInactiveStatus } from "../enums.js";

@Entity("organisationtype")
@Unique(["name"])
export class OrganisationType {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Organisation, (organisation) => organisation.organisationtype)
  organisations!: Organisation[];

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255 })
  description!: string;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
