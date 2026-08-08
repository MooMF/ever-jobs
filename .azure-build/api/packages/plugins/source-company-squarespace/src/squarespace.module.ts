import { Module } from '@nestjs/common';
import { SquarespaceService } from './squarespace.service';

@Module({ providers: [SquarespaceService], exports: [SquarespaceService] })
export class SquarespaceModule {}
