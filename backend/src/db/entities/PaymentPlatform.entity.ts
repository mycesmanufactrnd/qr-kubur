import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ActiveInactiveStatus } from "../enums.ts";
import { Donation } from "./Donation.entity.ts";
import { OrganisationPaymentConfig } from "./OrganisationPaymentConfig.entity.ts";
import { TahfizPaymentConfig } from "./TahfizPaymentConfig.entity.ts";

@Entity("paymentplatform")
export class PaymentPlatform {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255 })
    code!: string;

    @Column("varchar", { length: 255 })
    name!: string;
    
    @Column("varchar", { length: 255 })
    category!: string;

    @Column({
        type: "enum",
        enum: ActiveInactiveStatus,
        default: ActiveInactiveStatus.ACTIVE,
    })
    status!: ActiveInactiveStatus;

    @Column("varchar", { length: 50, nullable: true })
    icon?: string;

    @OneToMany(() => Donation, (donations) => donations.paymentplatform)
    donations!: Donation[];

    @OneToMany(() => OrganisationPaymentConfig, (organisationpaymentconfigs) => organisationpaymentconfigs.paymentplatform)
    organisationpaymentconfigs!: OrganisationPaymentConfig[];

    @OneToMany(() => TahfizPaymentConfig, (tahfizpaymentconfigs) => tahfizpaymentconfigs.paymentplatform)
    tahfizpaymentconfigs!: TahfizPaymentConfig[];

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}