import { Module } from '@nestjs/common';
import { BicyclehealthService } from './bicyclehealth.service';

@Module({ providers: [BicyclehealthService], exports: [BicyclehealthService] })
export class BicyclehealthModule {}
