import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findAll(
    @Query('popular') popular?: string,
    @Query('search') search?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.venuesService.findAll({
      popularOnly: popular === 'true',
      search,
      cityId,
    });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.venuesService.findBySlug(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateVenueDto) {
    return this.venuesService.create(dto);
  }
}
