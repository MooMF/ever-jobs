import { Module } from '@nestjs/common';
import { ApiiroService } from './apiiro.service';

@Module({ providers: [ApiiroService], exports: [ApiiroService] })
export class ApiiroModule {}
