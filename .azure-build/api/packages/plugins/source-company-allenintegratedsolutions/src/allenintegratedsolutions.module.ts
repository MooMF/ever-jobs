import { Module } from '@nestjs/common';
import { AllenintegratedsolutionsService } from './allenintegratedsolutions.service';

@Module({ providers: [AllenintegratedsolutionsService], exports: [AllenintegratedsolutionsService] })
export class AllenintegratedsolutionsModule {}
