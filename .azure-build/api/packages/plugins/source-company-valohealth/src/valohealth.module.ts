import { Module } from '@nestjs/common';
import { ValohealthService } from './valohealth.service';

@Module({ providers: [ValohealthService], exports: [ValohealthService] })
export class ValohealthModule {}
