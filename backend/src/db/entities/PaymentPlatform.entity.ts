import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ActiveInactiveStatus } from "../enums.ts";
import { Donation } from "./Donation.entity.ts";
import { OrganisationPaymentConfig } from "./OrganisationPaymentConfig.entity.ts";
import { TahfizPaymentConfig } from "./TahfizPaymentConfig.entity.ts";
import { PaymentField } from "./PaymentField.entity.ts";

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