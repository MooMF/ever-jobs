import { Module } from '@nestjs/common';
import { CloverhealthService } from './cloverhealth.service';

@Module({ providers: [CloverhealthService], exports: [CloverhealthService] })
export class CloverhealthModule {}
