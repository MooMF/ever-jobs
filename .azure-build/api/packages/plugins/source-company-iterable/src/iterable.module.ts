import { Module } from '@nestjs/common';
import { IterableService } from './iterable.service';

@Module({ providers: [IterableService], exports: [IterableService] })
export class IterableModule {}
