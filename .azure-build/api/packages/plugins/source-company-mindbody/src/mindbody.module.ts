import { Module } from '@nestjs/common';
import { MindbodyService } from './mindbody.service';

@Module({ providers: [MindbodyService], exports: [MindbodyService] })
export class MindbodyModule {}
