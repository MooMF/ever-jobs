import { Module } from '@nestjs/common';
import { MoniepointService } from './moniepoint.service';

@Module({ providers: [MoniepointService], exports: [MoniepointService] })
export class MoniepointModule {}
