import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindSuppliersQueryDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
