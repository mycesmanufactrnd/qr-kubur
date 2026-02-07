import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TahfizCenter } from './TahfizCenter.entity.ts';
import { Mosque } from './Mosque.entity.ts';

@Entity('activitypost')
export class ActivityPost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  title!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  photourl?: string;

  @Column({ type: 'boolean', default: true })
  ispublished!: boolean;

  // Explicitly defined as 'int' to fix the "cannot be guessed" error
  @Column({ type: 'int', nullable: true })
  mosqueId?: number | null;

  @Column({ type: 'int', nullable: true })
  tahfizId?: number | null;

  @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.activityposts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "tahfizId" }) 
  tahfizcenter?: TahfizCenter | null;

  @ManyToOne(() => Mosque, (mosque) => mosque.activityposts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "mosqueId" }) 
  mosque?: Mosque | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @UpdateDateColumn({ name: "updatedat" })
  updatedat!: Date;
}