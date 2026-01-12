import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organisation } from "./Organisation.entity.ts";
import { PaymentPlatform } from "./PaymentPlatform.entity.ts";
import { PaymentField } from "./PaymentField.entity.ts";

@Entity("organisationpaymentconfig")
export class OrganisationPaymentConfig {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisationpaymentconfigs, {
        nullable: true,
        onDelete: "SET NULL",
    })
    organisation?: Organisation | null;

    @ManyToOne(() => PaymentPlatform, (paymentplatform) => paymentplatform.organisationpaymentconfigs, {
        nullable: true,
        onDelete: "SET NULL",
    })
    paymentplatform?: PaymentPlatform | null;

    @ManyToOne(() => PaymentField, (paymentfield) => paymentfield.organisationpaymentconfigs, {
        nullable: true,
        onDelete: "SET NULL",
    })
    paymentfield?: PaymentField | null;
    
    @Column("varchar", { length: 255, nullable: true })
    value?: string;
    
    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}