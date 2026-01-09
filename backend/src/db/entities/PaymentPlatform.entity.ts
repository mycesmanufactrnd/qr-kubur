import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ActiveInactiveStatus } from "../enums.ts";
import { Donation } from "./Donation.entity.ts";

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

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}