import { Module } from '@nestjs/common';
import { ApartmentlifeService } from './apartmentlife.service';

@Module({ providers: [ApartmentlifeService], exports: [ApartmentlifeService] })
export class ApartmentlifeModule {}
