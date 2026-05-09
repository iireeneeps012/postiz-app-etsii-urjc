import { IsIn, IsString } from 'class-validator';

export class UpdateTeamMemberRoleDto {
  @IsString()
  @IsIn(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';
}
