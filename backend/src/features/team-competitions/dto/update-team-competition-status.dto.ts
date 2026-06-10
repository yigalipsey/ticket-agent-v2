import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateTeamCompetitionStatusDto {
  @IsNotEmpty()
  @IsIn(['active', 'eliminated', 'relegated', 'withdrawn'])
  status!: 'active' | 'eliminated' | 'relegated' | 'withdrawn';
}
