import { Module } from '@nestjs/common';
import { InstabaseService } from './instabase.service';

@Module({ providers: [InstabaseService], exports: [InstabaseService] })
export class InstabaseModule {}
