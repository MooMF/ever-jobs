import { Module } from '@nestjs/common';
import { IsomorphicLabsService } from './isomorphiclabs.service';

@Module({ providers: [IsomorphicLabsService], exports: [IsomorphicLabsService] })
export class IsomorphicLabsModule {}
