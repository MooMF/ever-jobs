import { Module } from '@nestjs/common';
import { ThirdLoveService } from './thirdlove.service';

@Module({ providers: [ThirdLoveService], exports: [ThirdLoveService] })
export class ThirdLoveModule {}
