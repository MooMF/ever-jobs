import { Module } from '@nestjs/common';
import { GofundmeService } from './gofundme.service';

@Module({ providers: [GofundmeService], exports: [GofundmeService] })
export class GofundmeModule {}
