import { Module } from '@nestjs/common';
import { QuaiseService } from './quaise.service';

@Module({ providers: [QuaiseService], exports: [QuaiseService] })
export class QuaiseModule {}
