import { Module } from '@nestjs/common';
import { WeeeService } from './weee.service';

@Module({ providers: [WeeeService], exports: [WeeeService] })
export class WeeeModule {}
