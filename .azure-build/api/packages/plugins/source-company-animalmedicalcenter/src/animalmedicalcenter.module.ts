import { Module } from '@nestjs/common';
import { AnimalmedicalcenterService } from './animalmedicalcenter.service';

@Module({ providers: [AnimalmedicalcenterService], exports: [AnimalmedicalcenterService] })
export class AnimalmedicalcenterModule {}
