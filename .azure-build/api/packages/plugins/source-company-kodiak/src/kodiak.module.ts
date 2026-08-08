import { Module } from '@nestjs/common';
import { KodiakService } from './kodiak.service';

@Module({ providers: [KodiakService], exports: [KodiakService] })
export class KodiakModule {}
