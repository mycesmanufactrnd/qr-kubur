import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

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

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}