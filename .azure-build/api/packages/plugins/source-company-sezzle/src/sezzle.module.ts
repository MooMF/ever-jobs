import { Module } from '@nestjs/common';
import { SezzleService } from './sezzle.service';

@Module({ providers: [SezzleService], exports: [SezzleService] })
export class SezzleModule {}
