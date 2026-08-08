import { Module } from '@nestjs/common';
import { AmericaninstituteService } from './americaninstitute.service';

@Module({ providers: [AmericaninstituteService], exports: [AmericaninstituteService] })
export class AmericaninstituteModule {}
