import { Module } from '@nestjs/common';
import { NateraService } from './natera.service';

@Module({ providers: [NateraService], exports: [NateraService] })
export class NateraModule {}
