import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { SEOContentDto } from '../../../common/dto/seo-content.dto';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export class CreateTeamDto {
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/, {
    message: 'code must be exactly 3 alphabetical characters',
  })
  code!: string;

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

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  shirtImageUrl?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, {
    message: 'primaryColor must be a 6-character hex color starting with #',
  })
  primaryColor?: string;

  @IsString()
  @IsOptional()
  @Matches(HEX_COLOR_PATTERN, {
    message: 'secondaryColor must be a 6-character hex color starting with #',
  })
  secondaryColor?: string;

  @IsInt()
  @IsOptional()
  apiFootballId?: number;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ValidateNested()
  @Type(() => SEOContentDto)
  @IsOptional()
  seoContent?: SEOContentDto;
}
