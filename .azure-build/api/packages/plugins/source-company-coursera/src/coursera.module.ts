import { Module } from '@nestjs/common';
import { CourseraService } from './coursera.service';

@Module({ providers: [CourseraService], exports: [CourseraService] })
export class CourseraModule {}
