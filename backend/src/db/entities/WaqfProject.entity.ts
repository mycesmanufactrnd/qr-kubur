import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProjectStatus, WaqfCategory, WaqfType } from '../enums.ts';

@Entity('waqfproject')
export class WaqfProject {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  waqfname!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: WaqfCategory,
    default: WaqfCategory.GENERALCHARITY,
  })
  category!: WaqfCategory;

  @Column({ type: 'text', nullable: true })
  beneficiaries?: string;

  @Column({ type: 'date', nullable: true })
  startdate?: Date;

  @Column({ type: 'date', nullable: true })
  enddate?: Date;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNED,
  })
  status!: ProjectStatus;

  @Column({
    type: 'float',
    default: 0,
  })
  progresspercentage!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalrequired!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountcollected!: number;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  responsibleperson?: string;

  @Column({
    type: 'enum',
    enum: WaqfType,
    nullable: true,
  })
  waqftype?: WaqfType;

  @Column({ type: 'text', nullable: true })
  photourl?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @UpdateDateColumn({ name: "updatedat" })
  updatedat!: Date;
}