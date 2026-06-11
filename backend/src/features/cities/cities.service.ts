import { Injectable, NotFoundException } from "@nestjs/common";
import { CitiesRepository } from "./cities.repository";
import type { NewCity } from "./cities.types";
import { translateDomainError } from "../../db/error-handler";

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

  async create(dto: NewCity) {
    try {
      return await this.citiesRepository.create(dto);
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }
}
