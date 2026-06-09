import { Injectable, NotFoundException } from '@nestjs/common';
import { CompetitionsRepository } from './competitions.repository';
import type { CompetitionType, NewCompetition } from './competitions.types';

@Injectable()
export class CompetitionsService {
  constructor(
    private readonly competitionsRepository: CompetitionsRepository,
  ) {}

  findAll(options?: { popularOnly?: boolean; type?: CompetitionType }) {
    return this.competitionsRepository.findAll(options);
  }

  async findBySlug(slug: string) {
    const competition = await this.competitionsRepository.findBySlug(slug);
    if (!competition) {
      throw new NotFoundException(
        `Competition with slug "${slug}" not found`,
      );
    }
    return competition;
  }

  create(dto: NewCompetition) {
    return this.competitionsRepository.create(dto);
  }
}
