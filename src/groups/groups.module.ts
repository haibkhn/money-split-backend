import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from '../entities/group.entity';
import { UrlService } from 'src/services/url/url.service';

@Module({
  imports: [TypeOrmModule.forFeature([Group])],
  controllers: [GroupsController],
  providers: [GroupsService, UrlService],
  exports: [GroupsService],
})
export class GroupsModule {}
