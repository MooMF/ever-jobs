import { Module } from '@nestjs/common';
import { SamsaraService } from './samsara.service';

@Module({ providers: [SamsaraService], exports: [SamsaraService] })
export class SamsaraModule {}
