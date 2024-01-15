import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConfigValueType } from '@anyit/cfg';
import { Config } from '../config';

@Entity(Config.tableName)
export class ConfigModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @UpdateDateColumn({ name: 'changes_check' })
  changesCheck!: Date;

  @Column()
  service!: string;

  @Column('varchar', { nullable: true, name: 'service_version' })
  serviceVersion!: string | null;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column('jsonb')
  value!: { type: ConfigValueType; data: any };

  @Column('jsonb', { nullable: true })
  meta!: { [key: string]: any } | null;
}
