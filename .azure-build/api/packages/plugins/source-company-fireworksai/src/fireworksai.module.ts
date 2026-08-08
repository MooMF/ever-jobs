import { Module } from '@nestjs/common';
import { FireworksaiService } from './fireworksai.service';

@Module({ providers: [FireworksaiService], exports: [FireworksaiService] })
export class FireworksaiModule {}
