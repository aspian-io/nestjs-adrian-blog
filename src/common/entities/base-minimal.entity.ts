import { Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseMinimalEntity {
  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @CreateDateColumn( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' } )
  createdAt?: Date;

  @UpdateDateColumn( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' } )
  updatedAt?: Date;

  @Column( { nullable: true } )
  ipAddress?: string;

  @Column( { nullable: true } )
  userAgent?: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}