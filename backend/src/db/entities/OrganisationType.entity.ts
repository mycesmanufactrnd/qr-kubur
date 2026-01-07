import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum OrganisationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("organisationtype")
export class OrganisationType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255 })
  description!: string;

  @Column({
    type: "enum",
    enum: OrganisationStatus,
    default: OrganisationStatus.ACTIVE,
  })
  status!: OrganisationStatus;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
