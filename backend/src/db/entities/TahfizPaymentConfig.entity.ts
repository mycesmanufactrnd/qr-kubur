import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PaymentPlatform } from "./PaymentPlatform.entity.ts";
import { PaymentField } from "./PaymentField.entity.ts";
import { TahfizCenter } from "./TahfizCenter.entity.ts";

@Entity("tahfizpaymentconfig")
export class TahfizPaymentConfig {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.tahfizpaymentconfigs, {
        nullable: true,
        onDelete: "SET NULL",
    })
    tahfizcenter?: TahfizCenter | null;

    @ManyToOne(() => PaymentPlatform, (paymentplatform) => paymentplatform.tahfizpaymentconfigs, {
        nullable: true,
        onDelete: "SET NULL",
    })
    paymentplatform?: PaymentPlatform | null;

    @ManyToOne(() => PaymentField, (paymentfield) => paymentfield.tahfizpaymentconfigs, {
        nullable: true,
        onDelete: "SET NULL",
    })
    paymentfield?: PaymentField | null;
    
    @Column("varchar", { length: 255, nullable: true })
    value?: string;
    
    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}