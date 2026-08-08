import { Module } from '@nestjs/common';
import { UnderdogService } from './underdogfantasy.service';

@Module({ providers: [UnderdogService], exports: [UnderdogService] })
export class UnderdogModule {}
