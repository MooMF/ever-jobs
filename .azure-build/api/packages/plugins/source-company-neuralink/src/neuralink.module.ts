import { Module } from '@nestjs/common';
import { NeuralinkService } from './neuralink.service';

@Module({ providers: [NeuralinkService], exports: [NeuralinkService] })
export class NeuralinkModule {}
