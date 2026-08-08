import { Module } from '@nestjs/common';
import { ParsleyhealthService } from './parsleyhealth.service';

@Module({ providers: [ParsleyhealthService], exports: [ParsleyhealthService] })
export class ParsleyhealthModule {}
