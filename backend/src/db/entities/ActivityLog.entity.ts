import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("activitylog")
export class ActivityLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    activitytype?: string;
    // define which activity
    
    @Column("varchar", { length: 255, nullable: true })
    functionname?: string;
    // define which function it call from
    
    @Column("varchar", { length: 255, nullable: true })
    useremail?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    level?: string;
    // info, warn, error, debug
    
    @Column("text", { nullable: true })
    summary?: string;
    // messages, if error, use error message at catch
    
    @Column("text", { nullable: true })
    extramessage?: string;
    // extra messages, if error, use error message at catch

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}