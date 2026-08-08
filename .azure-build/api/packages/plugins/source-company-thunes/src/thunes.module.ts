import { Module } from '@nestjs/common';
import { ThunesService } from './thunes.service';

@Module({ providers: [ThunesService], exports: [ThunesService] })
export class ThunesModule {}
