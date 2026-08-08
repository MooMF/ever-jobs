import { Module } from '@nestjs/common';
import { OscarService } from './oscar.service';

@Module({ providers: [OscarService], exports: [OscarService] })
export class OscarModule {}
