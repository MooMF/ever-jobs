import { Module } from '@nestjs/common';
import { AlmaService } from './alma.service';

@Module({ providers: [AlmaService], exports: [AlmaService] })
export class AlmaModule {}
