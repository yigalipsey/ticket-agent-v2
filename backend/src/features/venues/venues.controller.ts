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
import { FindVenuesQueryDto } from './dto/find-venues-query.dto';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findAll(@Query() query: FindVenuesQueryDto) {
    return this.venuesService.findAll({
      popularOnly: query.popular === 'true',
      search: query.search,
      cityId: query.cityId,
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
