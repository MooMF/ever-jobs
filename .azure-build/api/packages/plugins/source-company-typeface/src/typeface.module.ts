import { Module } from '@nestjs/common';
import { TypefaceService } from './typeface.service';

@Module({ providers: [TypefaceService], exports: [TypefaceService] })
export class TypefaceModule {}
