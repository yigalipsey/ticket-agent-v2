import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  ValidateNested,
} from "class-validator";
import { FaqItemDto, SEOContentDto } from "../../../common/dto/seo-content.dto";
import type { CompetitionType } from "../competitions.types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COMPETITION_TYPES: CompetitionType[] = ["League", "Cup"];

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(SLUG_PATTERN, {
    message: "slug must be lowercase alphanumeric words separated by hyphens",
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

  @IsUUID()
  @IsOptional()
  parentCompetitionId?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(COMPETITION_TYPES)
  @IsOptional()
  type?: CompetitionType;

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

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
  apiCompetitionId?: number;
}
