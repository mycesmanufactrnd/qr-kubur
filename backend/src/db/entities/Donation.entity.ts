import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organisation } from "./Organisation.entity.ts";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { VerificationStatus } from "../enums.ts";

@Entity("donation")
export class Donation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    donorname?: string;

    @Column("varchar", { length: 100, nullable: true })
    donoremail?: string;
    
    @Column("varchar", { length: 100, nullable: true })
    donorphoneno?: string;
    
    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    amount?: number;

    @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.donations, {
        nullable: true,
        onDelete: "SET NULL",
    })
    tahfizcenter?: TahfizCenter | null;

    @ManyToOne(() => Organisation, (organisation) => organisation.donations, {
        nullable: true,
        onDelete: "SET NULL",
    })
    organisation?: Organisation | null;

    @Column("varchar", { length: 255, nullable: true })
    referenceno?: string;

    @Column({
        type: "enum",
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    })
    status!: VerificationStatus;

    @Column("text", { nullable: true })
    notes?: string;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}