import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { User } from "./User.entity.ts";
import { OrganisationType } from "./OrganisationType.entity.ts";
import { ActiveInactiveStatus } from "../enums.js";
import { Grave } from "./Grave.entity.ts";
import { Donation } from "./Donation.entity.ts";
import { OrganisationPaymentConfig } from "./OrganisationPaymentConfig.entity.ts";
import { Mosque } from "./Mosque.entity.ts";
import { DeathCharity } from "../entities.ts";
import { ServiceOffered } from "./ServiceOffered.entity.ts";
import { Quotation } from "./Quotation.entity.ts";

@Entity("organisation")
export class Organisation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OrganisationType, (organisationtype) => organisationtype.organisations, {
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

  @OneToMany(() => Mosque, (mosque) => mosque.organisation)
  mosques?: Mosque[];

  @OneToMany(() => DeathCharity, (deathcharites) => deathcharites.organisation)
  deathcharites?: DeathCharity[];

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

  @Column("varchar", { length: 255, nullable: true })
  photourl?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @Column({ type: "boolean", default: false })
  canbedonated!: boolean;

  @Column({ type: "boolean", default: false })
  isgraveservices!: boolean;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;

  @OneToMany(() => User, (user) => user.organisation)
  users!: User[];

  @OneToMany(() => Donation, (donations) => donations.tahfizcenter)
  donations!: Donation[];

  @OneToMany(() => OrganisationPaymentConfig, (organisationpaymentconfigs) => organisationpaymentconfigs.organisation)
  organisationpaymentconfigs!: OrganisationPaymentConfig[];

  @OneToMany(() => ServiceOffered, (services) => services.organisation)
  services!: ServiceOffered[];

  @OneToMany(() => Quotation, (quotations) => quotations.organisation)
  quotations?: Quotation[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @OneToMany(() => Grave, (grave) => grave.organisation)
  graves?: Grave[];
}

