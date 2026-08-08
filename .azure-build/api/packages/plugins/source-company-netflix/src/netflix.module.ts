import { Module } from '@nestjs/common';
import { NetflixService } from './netflix.service';

@Module({ providers: [NetflixService], exports: [NetflixService] })
export class NetflixModule {}
