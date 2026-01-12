import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { User } from "./User.entity.ts";
import { OrganisationType } from "./OrganisationType.entity.ts";
import { ActiveInactiveStatus } from "../enums.js";
import { Grave } from "./Grave.entity.ts";

@Entity("organisation")
export class Organisation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OrganisationType, (organisationtype) => organisationtype.organisation, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisationtype?: OrganisationType | null;

  @ManyToOne(() => Organisation, (parentorganisation) => parentorganisation.children, {
    nullable: true,
    onDelete: "SET NULL",
  })
  parentorganisation?: Organisation | null;

  @OneToMany(() => Organisation, (child) => child.parentorganisation)
  children?: Organisation[];

  @Column("varchar", { length: 255 })
  name!: string;
  
  @Column("text", { array: true, nullable: true })
  states?: string[];

  @Column("varchar", { length: 255, nullable: true })
  address?: string;

  @Column("varchar", { length: 255, nullable: true })
  phone?: string;

  @Column("varchar", { length: 255, nullable: true })
  email?: string;

  @Column("varchar", { length: 255, nullable: true })
  url?: string;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;

  @OneToMany(() => User, (user) => user.organisation)
  user!: User[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @OneToMany(() => Grave, (grave) => grave.organisation)
  graves?: Grave[];
}
