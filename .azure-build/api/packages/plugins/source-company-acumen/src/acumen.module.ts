import { Module } from '@nestjs/common';
import { AcumenService } from './acumen.service';

@Module({ providers: [AcumenService], exports: [AcumenService] })
export class AcumenModule {}
