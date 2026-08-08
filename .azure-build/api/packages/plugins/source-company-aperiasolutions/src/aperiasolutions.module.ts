import { Module } from '@nestjs/common';
import { AperiasolutionsService } from './aperiasolutions.service';

@Module({ providers: [AperiasolutionsService], exports: [AperiasolutionsService] })
export class AperiasolutionsModule {}
