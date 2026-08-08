import { Module } from '@nestjs/common';
import { MomentousService } from './momentous.service';

@Module({ providers: [MomentousService], exports: [MomentousService] })
export class MomentousModule {}
