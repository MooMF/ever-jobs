import { Module } from '@nestjs/common';
import { QuanataService } from './quanata.service';

@Module({ providers: [QuanataService], exports: [QuanataService] })
export class QuanataModule {}
