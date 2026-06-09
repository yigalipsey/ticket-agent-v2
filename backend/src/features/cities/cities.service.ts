import { Injectable, NotFoundException } from "@nestjs/common";
import { CitiesRepository } from "./cities.repository";
import type { NewCity } from "./cities.types";

@Injectable()
export class CitiesService {
  constructor(private readonly citiesRepository: CitiesRepository) {}

  findAll(options?: { popularOnly?: boolean }) {
    return this.citiesRepository.findAll(options);
  }

  async findBySlug(slug: string) {
    const city = await this.citiesRepository.findBySlug(slug);
    if (!city) {
      throw new NotFoundException(`City with slug "${slug}" not found`);
    }
    return city;
  }

  create(dto: NewCity) {
    return this.citiesRepository.create(dto);
  }
}
