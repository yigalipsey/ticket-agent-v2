import { Injectable, NotFoundException } from '@nestjs/common';
import { CompetitionsRepository } from './competitions.repository';
import type { CompetitionType, NewCompetition } from './competitions.types';
import type { CreateCompetitionDto } from './dto/create-competition.dto';
import { translateDomainError } from '../../db/error-handler';

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

  async create(dto: CreateCompetitionDto) {
    const newCompetition: NewCompetition = {
      slug: dto.slug,
      name: dto.name,
      name_en: dto.name_en,
      country_id: dto.countryId,
      parent_competition_id: dto.parentCompetitionId,
      logo_url: dto.logoUrl,
      image_url: dto.imageUrl,
      banner_url: dto.backgroundImage,
      description: dto.description,
      type: dto.type,
      is_popular: dto.isPopular,
      seo_content: dto.seoContent,
      faqs: dto.faqs,
      api_competition_id: dto.apiCompetitionId,
    };

    try {
      return await this.competitionsRepository.create(newCompetition);
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }
}
