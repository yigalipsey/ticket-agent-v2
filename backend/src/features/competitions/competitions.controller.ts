import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import type { CompetitionType } from './competitions.types';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  findAll(
    @Query('popular') popular?: string,
    @Query('type') type?: string,
  ) {
    const options: { popularOnly?: boolean; type?: CompetitionType } = {};

    if (popular === 'true') {
      options.popularOnly = true;
    }

    if (type === 'League' || type === 'Cup') {
      options.type = type;
    }

    return this.competitionsService.findAll(options);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.competitionsService.findBySlug(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCompetitionDto) {
    return this.competitionsService.create({
      slug: dto.slug,
      name: dto.name,
      name_en: dto.name_en,
      country_id: dto.countryId,
      parent_competition_id: dto.parentCompetitionId,
      logo_url: dto.logoUrl,
      image_url: dto.imageUrl,
      background_image: dto.backgroundImage,
      description: dto.description,
      type: dto.type,
      is_popular: dto.isPopular,
      seo_content: dto.seoContent,
      faqs: dto.faqs,
      api_competition_id: dto.apiCompetitionId,
    });
  }
}
