import { Module } from '@nestjs/common';
import { AplayersService } from './aplayers.service';

@Module({ providers: [AplayersService], exports: [AplayersService] })
export class AplayersModule {}
