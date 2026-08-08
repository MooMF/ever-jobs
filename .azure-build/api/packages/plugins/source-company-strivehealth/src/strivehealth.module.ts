import { Module } from '@nestjs/common';
import { StrivehealthService } from './strivehealth.service';

@Module({ providers: [StrivehealthService], exports: [StrivehealthService] })
export class StrivehealthModule {}
