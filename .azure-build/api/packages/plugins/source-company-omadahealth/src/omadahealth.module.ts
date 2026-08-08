import { Module } from '@nestjs/common';
import { OmadahealthService } from './omadahealth.service';

@Module({ providers: [OmadahealthService], exports: [OmadahealthService] })
export class OmadahealthModule {}
