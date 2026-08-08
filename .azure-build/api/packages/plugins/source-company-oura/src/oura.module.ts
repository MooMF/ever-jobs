import { Module } from '@nestjs/common';
import { OuraService } from './oura.service';

@Module({ providers: [OuraService], exports: [OuraService] })
export class OuraModule {}
