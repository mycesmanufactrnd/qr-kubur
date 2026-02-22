import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("runningno")
export class RunningNo {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("integer", { default: 0 })
    donation!: number;
    
    @Column("integer", { default: 0 })
    tahlil!: number;

    @Column("integer", { default: 0 })
    quotation!: number;

    @Column("integer", { default: 0 })
    deathcharity!: number;
    
    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}
