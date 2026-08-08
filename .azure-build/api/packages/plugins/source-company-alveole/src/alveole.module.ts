import { Module } from '@nestjs/common';
import { AlveoleService } from './alveole.service';

@Module({ providers: [AlveoleService], exports: [AlveoleService] })
export class AlveoleModule {}
