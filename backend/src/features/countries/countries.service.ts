import { Injectable, NotFoundException } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import type { NewCountry } from './countries.types';

@Injectable()
export class CountriesService {
  constructor(private readonly countriesRepository: CountriesRepository) {}

  findAll() {
    return this.countriesRepository.findAll();
  }

  async findBySlug(slug: string) {
    const country = await this.countriesRepository.findBySlug(slug);
    if (!country) {
      throw new NotFoundException(`Country with slug "${slug}" not found`);
    }
    return country;
  }

  create(dto: NewCountry) {
    return this.countriesRepository.create(dto);
  }
}
