import { Module } from '@nestjs/common';
import { YugabyteService } from './yugabyte.service';

@Module({ providers: [YugabyteService], exports: [YugabyteService] })
export class YugabyteModule {}
