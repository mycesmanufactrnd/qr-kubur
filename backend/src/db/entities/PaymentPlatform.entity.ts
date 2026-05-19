// @ts-nocheck
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ActiveInactiveStatus } from "../enums.js";
import { Donation } from "./Donation.entity.js";
import { OrganisationPaymentConfig } from "./OrganisationPaymentConfig.entity.js";
import { TahfizPaymentConfig } from "./TahfizPaymentConfig.entity.js";
import { PaymentField } from "./PaymentField.entity.js";

@Entity("paymentplatform")
@Unique(["code"])
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

    @OneToMany(() => OrganisationPaymentConfig, (organisationpaymentconfigs) => organisationpaymentconfigs.paymentplatform)
    organisationpaymentconfigs!: OrganisationPaymentConfig[];

    @OneToMany(() => TahfizPaymentConfig, (tahfizpaymentconfigs) => tahfizpaymentconfigs.paymentplatform)
    tahfizpaymentconfigs!: TahfizPaymentConfig[];

    @OneToMany(() => PaymentField, (paymentfields) => paymentfields.paymentplatform)
    paymentfields!: PaymentField[];

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}