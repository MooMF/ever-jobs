import { Module } from '@nestjs/common';
import { StoryblokService } from './storyblok.service';

@Module({ providers: [StoryblokService], exports: [StoryblokService] })
export class StoryblokModule {}
