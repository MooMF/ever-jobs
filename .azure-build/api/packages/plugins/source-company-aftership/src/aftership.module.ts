import { Module } from '@nestjs/common';
import { AftershipService } from './aftership.service';

@Module({ providers: [AftershipService], exports: [AftershipService] })
export class AftershipModule {}
