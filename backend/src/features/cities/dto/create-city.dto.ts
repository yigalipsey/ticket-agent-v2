import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  FaqItemDto,
  SEOContentDto,
} from '../../../common/dto/seo-content.dto';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCityDto {
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
  name_en?: string;

  @IsInt()
  @Min(1)
  countryId!: number;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ValidateNested()
  @Type(() => SEOContentDto)
  @IsOptional()
  seoContent?: SEOContentDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  @IsOptional()
  faqs?: FaqItemDto[];
}
