import { Module } from '@nestjs/common';
import { RedwoodmaterialsService } from './redwoodmaterials.service';

@Module({ providers: [RedwoodmaterialsService], exports: [RedwoodmaterialsService] })
export class RedwoodmaterialsModule {}
