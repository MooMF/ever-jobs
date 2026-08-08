import { Module } from '@nestjs/common';
import { YotpoService } from './yotpo.service';

@Module({ providers: [YotpoService], exports: [YotpoService] })
export class YotpoModule {}
