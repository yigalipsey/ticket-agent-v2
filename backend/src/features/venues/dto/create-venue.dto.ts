import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  FaqItemDto,
  SEOContentDto,
} from '../../../common/dto/seo-content.dto';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateVenueDto {
  @IsString()
  @IsNotEmpty()
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  addressEn?: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @IsUrl()
  @IsOptional()
  mapUrl?: string;

  @ValidateNested()
  @Type(() => SEOContentDto)
  @IsOptional()
  seoContent?: SEOContentDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  @IsOptional()
  faqs?: FaqItemDto[];

  @IsInt()
  @IsOptional()
  apiFootballId?: number;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsUUID()
  @IsNotEmpty()
  cityId!: string;
}
