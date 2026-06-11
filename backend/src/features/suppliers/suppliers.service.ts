import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SuppliersRepository, FindAllSuppliersOptions } from './suppliers.repository';
import type { CreateSupplierDto } from './dto/create-supplier.dto';
import type { UpdateSupplierDto } from './dto/update-supplier.dto';
import type { NewSupplier, Supplier } from './suppliers.types';
import { translateDomainError } from '../../db/error-handler';

const MAX_SLUG_ATTEMPTS = 100;

@Injectable()
export class SuppliersService {
  constructor(private readonly repository: SuppliersRepository) {}

  findAll(options?: FindAllSuppliersOptions): Promise<Supplier[]> {
    return this.repository.findAll(options);
  }

  async findById(id: string): Promise<Supplier> {
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }
    return supplier;
  }

  async findByInternalCode(internalCode: string): Promise<Supplier> {
    const supplier = await this.repository.findByInternalCode(internalCode);
    if (!supplier) {
      throw new NotFoundException(`Supplier with internal_code "${internalCode}" not found`);
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const slug = await this.resolveSlugForCreate(dto);

    const newSupplier: NewSupplier = {
      name: dto.name,
      name_en: dto.nameEn,
      slug,
      origin: dto.origin ?? 'international',
      description: dto.description,
      image_url: dto.imageUrl,
      website_url: dto.websiteUrl,
      affiliate_link_base: dto.affiliateLinkBase,
      internal_code: dto.internalCode,
      external_rating: dto.externalRating,
      contact_info: dto.contactInfo,
      sync_config: dto.syncConfig,
      is_active: dto.isActive ?? true,
      priority: dto.priority ?? 0,
      metadata: dto.metadata,
      deactivated_at: dto.isActive === false ? new Date() : null,
    };

    try {
      return await this.repository.create(newSupplier);
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    const finalSlug = await this.resolveSlugForUpdate(dto, existing, id);
    const patch = this.buildUpdatePatch(dto, finalSlug, existing.slug);

    try {
      const updated = await this.repository.update(id, patch);
      if (!updated) {
        throw new NotFoundException(`Supplier with ID "${id}" not found`);
      }
      return updated;
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }

  async deactivate(id: string): Promise<Supplier> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }
    
    if (!existing.is_active) {
      return existing; // already deactivated
    }

    try {
      const updated = await this.repository.update(id, {
        is_active: false,
        deactivated_at: new Date(),
        updated_at: new Date(),
      });
      return updated!;
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async resolveSlugForCreate(dto: CreateSupplierDto): Promise<string> {
    let baseSlug = dto.slug;

    if (!baseSlug) {
      // Priority to nameEn over name
      const sourceName = dto.nameEn || dto.name;
      baseSlug = this.slugify(sourceName);
    }

    return this.resolveSlugCollision(baseSlug);
  }

  private async resolveSlugForUpdate(
    dto: UpdateSupplierDto,
    existing: Supplier,
    id: string,
  ): Promise<string> {
    if (dto.slug === undefined || dto.slug === existing.slug) {
      return existing.slug;
    }
    return this.resolveSlugCollision(dto.slug, id);
  }

  private async resolveSlugCollision(baseSlug: string, excludeId?: string): Promise<string> {
    let finalSlug = baseSlug;
    let suffix = 1;

    while (await this.repository.checkSlugExists(finalSlug, excludeId)) {
      if (suffix > MAX_SLUG_ATTEMPTS) {
        throw new ConflictException(
          `Could not generate a unique slug for "${baseSlug}" after ${MAX_SLUG_ATTEMPTS} attempts`,
        );
      }
      finalSlug = `${baseSlug}-${suffix++}`;
    }

    return finalSlug;
  }

  private buildUpdatePatch(
    dto: UpdateSupplierDto,
    finalSlug: string,
    existingSlug: string,
  ): Partial<NewSupplier> {
    const patch: Partial<NewSupplier> = {
      updated_at: new Date(),
    };

    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.nameEn !== undefined) patch.name_en = dto.nameEn;
    if (finalSlug !== existingSlug) patch.slug = finalSlug;
    if (dto.origin !== undefined) patch.origin = dto.origin;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.imageUrl !== undefined) patch.image_url = dto.imageUrl;
    if (dto.websiteUrl !== undefined) patch.website_url = dto.websiteUrl;
    if (dto.affiliateLinkBase !== undefined) patch.affiliate_link_base = dto.affiliateLinkBase;
    if (dto.internalCode !== undefined) patch.internal_code = dto.internalCode;
    if (dto.externalRating !== undefined) patch.external_rating = dto.externalRating;
    if (dto.contactInfo !== undefined) patch.contact_info = dto.contactInfo;
    if (dto.syncConfig !== undefined) patch.sync_config = dto.syncConfig;
    if (dto.isActive !== undefined) {
      patch.is_active = dto.isActive;
      patch.deactivated_at = dto.isActive === false ? new Date() : null;
    }
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.metadata !== undefined) patch.metadata = dto.metadata;

    return patch;
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace → hyphens
      .replace(/-+/g, '-'); // collapse consecutive hyphens
  }
}
