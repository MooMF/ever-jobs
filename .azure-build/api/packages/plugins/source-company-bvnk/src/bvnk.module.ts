import { Module } from '@nestjs/common';
import { BVNKService } from './bvnk.service';

@Module({ providers: [BVNKService], exports: [BVNKService] })
export class BVNKModule {}
