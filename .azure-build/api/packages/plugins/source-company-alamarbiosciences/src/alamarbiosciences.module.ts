import { Module } from '@nestjs/common';
import { AlamarbiosciencesService } from './alamarbiosciences.service';

@Module({ providers: [AlamarbiosciencesService], exports: [AlamarbiosciencesService] })
export class AlamarbiosciencesModule {}
