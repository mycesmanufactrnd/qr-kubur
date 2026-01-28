import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { OrganisationPaymentConfig } from "./OrganisationPaymentConfig.entity.ts";
import { TahfizPaymentConfig } from "./TahfizPaymentConfig.entity.ts";
import { PaymentPlatform } from "./PaymentPlatform.entity.ts";

@Entity("paymentfield")
@Unique(["key", "paymentplatform"])
export class PaymentField {
    @PrimaryGeneratedColumn()
    id!: number;
    
    @ManyToOne(() => PaymentPlatform, (paymentplatform) => paymentplatform.paymentfields, {
        nullable: true,
        onDelete: "SET NULL",
    })
    paymentplatform?: PaymentPlatform | null;

    @Column("varchar", { length: 255 })
    key!: string;
    
    @Column("varchar", { length: 255 })
    label!: string;
    
    @Column("varchar", { length: 255 })
    fieldtype!: string;
    
    @Column({ type: "boolean", default: true })
    required!: boolean;
    
    @Column("varchar", { length: 255, nullable: true })
    placeholder?: string;

    @OneToMany(() => OrganisationPaymentConfig, (organisationpaymentconfigs) => organisationpaymentconfigs.paymentfield)
    organisationpaymentconfigs!: OrganisationPaymentConfig[];

    @OneToMany(() => TahfizPaymentConfig, (tahfizpaymentconfigs) => tahfizpaymentconfigs.paymentfield)
    tahfizpaymentconfigs!: TahfizPaymentConfig[];

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}