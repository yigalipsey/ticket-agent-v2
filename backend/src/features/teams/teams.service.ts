import { Injectable, NotFoundException } from '@nestjs/common';
import { TeamsRepository } from './teams.repository';
import type { CreateTeamDto } from './dto/create-team.dto';
import type { NewTeam } from './teams.types';

@Injectable()
export class TeamsService {
  constructor(private readonly teamsRepository: TeamsRepository) {}

  findAll(options?: { popularOnly?: boolean; search?: string }) {
    return this.teamsRepository.findAll(options);
  }

  async findBySlug(slug: string) {
    const team = await this.teamsRepository.findBySlug(slug);
    if (!team) {
      throw new NotFoundException(`Team with slug "${slug}" not found`);
    }
    return team;
  }

  create(dto: CreateTeamDto) {
    const codeNormalized = dto.code.toUpperCase();
    const primaryColorNormalized = dto.primaryColor?.toUpperCase();
    const secondaryColorNormalized = dto.secondaryColor?.toUpperCase();

    const newTeam: NewTeam = {
      slug: dto.slug,
      name: dto.name,
      name_en: dto.nameEn,
      code: codeNormalized,
      logo_url: dto.logoUrl,
      shirt_image_url: dto.shirtImageUrl,
      image_url: dto.imageUrl,
      background_image: dto.backgroundImage,
      primary_color: primaryColorNormalized,
      secondary_color: secondaryColorNormalized,
      api_football_id: dto.apiFootballId,
      is_popular: dto.isPopular,
      seo_content: dto.seoContent,
    };

    return this.teamsRepository.create(newTeam);
  }
}
