import { Module } from '@nestjs/common';
import { AkkoService } from './akko.service';

@Module({ providers: [AkkoService], exports: [AkkoService] })
export class AkkoModule {}
