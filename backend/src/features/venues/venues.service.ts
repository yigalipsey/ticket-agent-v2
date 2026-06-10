import { Injectable, NotFoundException } from '@nestjs/common';
import { VenuesRepository } from './venues.repository';
import type { CreateVenueDto } from './dto/create-venue.dto';
import type { NewVenue } from './venues.types';

@Injectable()
export class VenuesService {
  constructor(private readonly venuesRepository: VenuesRepository) {}

  findAll(options?: { popularOnly?: boolean; search?: string; cityId?: string }) {
    return this.venuesRepository.findAll(options);
  }

  async findBySlug(slug: string) {
    const venue = await this.venuesRepository.findBySlug(slug);
    if (!venue) {
      throw new NotFoundException(`Venue with slug "${slug}" not found`);
    }
    return venue;
  }

  create(dto: CreateVenueDto) {
    const newVenue: NewVenue = {
      slug: dto.slug,
      name: dto.name,
      name_en: dto.nameEn,
      description: dto.description,
      address: dto.address,
      address_en: dto.addressEn,
      capacity: dto.capacity,
      latitude: dto.latitude,
      longitude: dto.longitude,
      image_url: dto.imageUrl,
      banner_url: dto.bannerUrl,
      map_url: dto.mapUrl,
      seo_content: dto.seoContent,
      faqs: dto.faqs,
      api_football_id: dto.apiFootballId,
      is_popular: dto.isPopular,
      city_id: dto.cityId,
    };

    return this.venuesRepository.create(newVenue);
  }
}
