import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  create(createGroupDto: CreateGroupDto) {
    const group = this.groupRepository.create(createGroupDto);
    return this.groupRepository.save(group);
  }

  findAll() {
    return this.groupRepository.find({
      relations: ['members', 'expenses'],
    });
  }

  findOne(id: string) {
    return this.groupRepository.findOne({
      where: { id },
      relations: ['members', 'expenses'],
    });
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    await this.groupRepository.update(id, updateGroupDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const group = await this.findOne(id);
    return this.groupRepository.remove(group);
  }
}
