import { Module } from '@nestjs/common';
import { InstacartService } from './instacart.service';

@Module({ providers: [InstacartService], exports: [InstacartService] })
export class InstacartModule {}
