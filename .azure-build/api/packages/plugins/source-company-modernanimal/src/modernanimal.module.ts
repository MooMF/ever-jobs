import { Module } from '@nestjs/common';
import { ModernanimalService } from './modernanimal.service';

@Module({ providers: [ModernanimalService], exports: [ModernanimalService] })
export class ModernanimalModule {}
