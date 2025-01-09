import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
import { Group } from '../entities/group.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    const group = await this.groupRepository.findOne({
      where: { id: createMemberDto.groupId },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with ID ${createMemberDto.groupId} not found`,
      );
    }

    const member = this.memberRepository.create({
      name: createMemberDto.name,
      balance: 0,
      group,
    });

    return this.memberRepository.save(member);
  }

  findAll() {
    return this.memberRepository.find({
      relations: ['group'],
    });
  }

  findOne(id: string) {
    return this.memberRepository.findOne({
      where: { id },
      relations: ['group'],
    });
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    Object.assign(member, updateMemberDto);
    return this.memberRepository.save(member);
  }

  async remove(id: string) {
    const member = await this.findOne(id);
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return this.memberRepository.remove(member);
  }

  findByGroup(groupId: string) {
    return this.memberRepository.find({
      where: { group: { id: groupId } },
      relations: ['group'],
    });
  }
}
