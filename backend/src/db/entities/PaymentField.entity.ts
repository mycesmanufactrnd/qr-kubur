import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganisationPaymentConfig } from "./OrganisationPaymentConfig.entity.ts";
import { TahfizPaymentConfig } from "./TahfizPaymentConfig.entity.ts";

@Entity("paymentfield")
export class PaymentField {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255 })
    code!: string;

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