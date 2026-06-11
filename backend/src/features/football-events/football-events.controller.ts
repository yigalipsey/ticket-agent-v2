import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FootballEventsService } from './football-events.service';
import { CreateFootballEventDto } from './dto/create-football-event.dto';
import { UpdateFootballEventDto } from './dto/update-football-event.dto';
import { FindFootballEventsQueryDto } from './dto/find-all-football-events.dto';

@Controller('football-events')
export class FootballEventsController {
  constructor(private readonly service: FootballEventsService) { }

  @Get()
  findAll(@Query() query: FindFootballEventsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':event_number')
  findByEventNumber(@Param('event_number', ParseIntPipe) eventNumber: number) {
    return this.service.findByEventNumber(eventNumber);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateFootballEventDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFootballEventDto,
  ) {
    return this.service.update(id, dto);
  }
}
