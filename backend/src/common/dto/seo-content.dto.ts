import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SEOBlockDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class SEOContentDto {
  @IsString()
  @IsNotEmpty()
  metaTitle!: string;

  @IsString()
  @IsNotEmpty()
  metaDescription!: string;

  @IsString()
  @IsNotEmpty()
  heroTitle!: string;

  @IsString()
  @IsNotEmpty()
  heroSubtitle!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SEOBlockDto)
  blocks!: SEOBlockDto[];
}

export class FaqItemDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
