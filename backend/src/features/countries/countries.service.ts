import { Injectable, NotFoundException } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import type { NewCountry } from './countries.types';
import type { CreateCountryDto } from './dto/create-country.dto';
import { translateDomainError } from '../../db/error-handler';

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

  async create(dto: CreateCountryDto) {
    const newCountry: NewCountry = {
      slug: dto.slug,
      name: dto.name,
      name_en: dto.name_en,
    };

    try {
      return await this.countriesRepository.create(newCountry);
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }
}
