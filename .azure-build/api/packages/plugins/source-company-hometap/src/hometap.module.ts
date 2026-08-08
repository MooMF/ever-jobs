import { Module } from '@nestjs/common';
import { HometapService } from './hometap.service';

@Module({ providers: [HometapService], exports: [HometapService] })
export class HometapModule {}
