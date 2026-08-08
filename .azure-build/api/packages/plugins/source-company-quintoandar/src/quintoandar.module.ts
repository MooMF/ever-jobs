import { Module } from '@nestjs/common';
import { QuintoAndarService } from './quintoandar.service';

@Module({ providers: [QuintoAndarService], exports: [QuintoAndarService] })
export class QuintoAndarModule {}
