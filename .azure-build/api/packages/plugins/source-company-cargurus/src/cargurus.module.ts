import { Module } from '@nestjs/common';
import { CarGurusService } from './cargurus.service';

@Module({ providers: [CarGurusService], exports: [CarGurusService] })
export class CarGurusModule {}
