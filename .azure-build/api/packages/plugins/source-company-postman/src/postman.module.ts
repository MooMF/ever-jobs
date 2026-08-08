import { Module } from '@nestjs/common';
import { PostmanService } from './postman.service';

@Module({ providers: [PostmanService], exports: [PostmanService] })
export class PostmanModule {}
