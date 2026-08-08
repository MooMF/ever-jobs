import { Module } from '@nestjs/common';
import { UdemyService } from './udemy.service';

@Module({ providers: [UdemyService], exports: [UdemyService] })
export class UdemyModule {}
