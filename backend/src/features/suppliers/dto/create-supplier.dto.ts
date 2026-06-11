import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { SUPPLIER_ORIGINS } from '../suppliers.schema';
import type { SupplierOrigin } from '../suppliers.types';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INTERNAL_CODE_PATTERN = /^[A-Z0-9_]+_API$/;

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @IsString()
  @IsOptional()
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  slug?: string;

  @IsIn(SUPPLIER_ORIGINS)
  @IsOptional()
  origin?: SupplierOrigin;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  affiliateLinkBase?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(INTERNAL_CODE_PATTERN, {
    message: 'internalCode must be uppercase alphanumeric with underscores, ending in _API',
  })
  internalCode!: string;

  @IsObject()
  @IsOptional()
  externalRating?: Record<string, any>;

  @IsObject()
  @IsOptional()
  contactInfo?: Record<string, any>;

  @IsObject()
  @IsOptional()
  syncConfig?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
