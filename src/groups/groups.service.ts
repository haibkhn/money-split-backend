import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
    try {
      this.logger.log(
        `Creating group with data: ${JSON.stringify(createGroupDto)}`,
      );

      const group = this.groupRepository.create({
        id: createGroupDto.id,
        name: createGroupDto.name,
        currency: createGroupDto.currency,
        members: [],
        expenses: [],
      });

      const savedGroup = await this.groupRepository.save(group);
      this.logger.log(`Group created successfully with ID: ${savedGroup.id}`);
      return savedGroup;
    } catch (error) {
      this.logger.error(
        `Failed to create group: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll() {
    return this.groupRepository.find({
      relations: ['members', 'expenses'],
    });
  }

  async findOne(id: string) {
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
