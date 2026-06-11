import { Injectable, NotFoundException } from "@nestjs/common";
import { CitiesRepository } from "./cities.repository";
import type { NewCity } from "./cities.types";
import type { CreateCityDto } from "./dto/create-city.dto";
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

  async create(dto: CreateCityDto) {
    const newCity: NewCity = {
      slug: dto.slug,
      name: dto.name,
      name_en: dto.name_en,
      country_id: dto.countryId,
      is_popular: dto.isPopular,
      image_url: dto.imageUrl,
      seo_content: dto.seoContent,
      faqs: dto.faqs,
    };

    try {
      return await this.citiesRepository.create(newCity);
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }
}
