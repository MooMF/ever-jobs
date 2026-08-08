import { Module } from '@nestjs/common';
import { QuinceService } from './quince.service';

@Module({ providers: [QuinceService], exports: [QuinceService] })
export class QuinceModule {}
