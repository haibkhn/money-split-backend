import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
      relations: [
        'members',
        'expenses',
        'expenses.payers',
        'expenses.participants',
      ],
    });
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }

    // Update only the allowed properties
    Object.assign(group, {
      name: updateGroupDto.name,
      currency: updateGroupDto.currency,
    });

    // Save the updated group
    return this.groupRepository.save(group);
  }

  async remove(id: string) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['members', 'expenses'],
    });
    if (!group) return null;
    return this.groupRepository.remove(group);
  }
}
