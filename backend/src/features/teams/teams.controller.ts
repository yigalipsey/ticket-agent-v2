import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(
    @Query('popular') popular?: string,
    @Query('search') search?: string,
  ) {
    return this.teamsService.findAll({
      popularOnly: popular === 'true',
      search,
    });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.teamsService.findBySlug(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }
}
