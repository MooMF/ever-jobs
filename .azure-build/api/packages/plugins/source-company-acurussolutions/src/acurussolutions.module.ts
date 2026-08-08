import { Module } from '@nestjs/common';
import { AcurussolutionsService } from './acurussolutions.service';

@Module({ providers: [AcurussolutionsService], exports: [AcurussolutionsService] })
export class AcurussolutionsModule {}
