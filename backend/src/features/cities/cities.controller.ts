import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CitiesService } from "./cities.service";
import { CreateCityDto } from "./dto/create-city.dto";

@Controller("cities")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  findAll(@Query("popular") popular?: string) {
    return this.citiesService.findAll({ popularOnly: popular === "true" });
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.citiesService.findBySlug(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }
}
