import { Module } from '@nestjs/common';
import { CaribouService } from './caribou.service';

@Module({ providers: [CaribouService], exports: [CaribouService] })
export class CaribouModule {}
