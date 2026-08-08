import { Module } from '@nestjs/common';
import { NanitService } from './nanit.service';

@Module({ providers: [NanitService], exports: [NanitService] })
export class NanitModule {}
