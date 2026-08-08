import { Module } from '@nestjs/common';
import { ClearService } from './clear.service';

@Module({ providers: [ClearService], exports: [ClearService] })
export class ClearModule {}
