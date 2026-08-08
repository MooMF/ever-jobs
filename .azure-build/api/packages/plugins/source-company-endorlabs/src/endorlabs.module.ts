import { Module } from '@nestjs/common';
import { EndorlabsService } from './endorlabs.service';

@Module({ providers: [EndorlabsService], exports: [EndorlabsService] })
export class EndorlabsModule {}
