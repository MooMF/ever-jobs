import { Module } from '@nestjs/common';
import { TypeformService } from './typeform.service';

@Module({ providers: [TypeformService], exports: [TypeformService] })
export class TypeformModule {}
