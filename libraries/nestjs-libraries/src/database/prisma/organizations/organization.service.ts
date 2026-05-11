import { CreateOrgUserDto } from '@gitroom/nestjs-libraries/dtos/auth/create.org.user.dto';
import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.repository';
import { NotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service';
import { AddTeamMemberDto } from '@gitroom/nestjs-libraries/dtos/settings/add.team.member.dto';
import { Organization, ShortLinkPreference } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(
    private _organizationRepository: OrganizationRepository,
    private _notificationsService: NotificationService
  ) {}
  async createOrgAndUser(
    body: Omit<CreateOrgUserDto, 'providerToken'> & { providerId?: string },
    ip: string,
    userAgent: string
  ) {
    return this._organizationRepository.createOrgAndUser(
      body,
      this._notificationsService.hasEmailProvider(),
      ip,
      userAgent
    );
  }

  async getCount() {
    return this._organizationRepository.getCount();
  }

  async createMaxUser(
    id: string,
    name: string,
    saasName: string,
    email: string
  ) {
    return this._organizationRepository.createMaxUser(
      id,
      name,
      saasName,
      email
    );
  }

  addUserToOrg(
    userId: string,
    id: string,
    orgId: string,
    role: 'USER' | 'ADMIN'
  ) {
    return this._organizationRepository.addUserToOrg(userId, id, orgId, role);
  }

  getOrgById(id: string) {
    return this._organizationRepository.getOrgById(id);
  }

  getOrgByApiKey(api: string) {
    return this._organizationRepository.getOrgByApiKey(api);
  }

  getUserOrg(id: string) {
    return this._organizationRepository.getUserOrg(id);
  }

  getOrgsByUserId(userId: string) {
    return this._organizationRepository.getOrgsByUserId(userId);
  }

  updateApiKey(orgId: string) {
    return this._organizationRepository.updateApiKey(orgId);
  }

  getTeam(orgId: string) {
    return this._organizationRepository.getTeam(orgId);
  }

  async setStreak(organizationId: string, type: 'start' | 'end') {
    return this._organizationRepository.setStreak(organizationId, type);
  }

  getOrgByCustomerId(customerId: string) {
    return this._organizationRepository.getOrgByCustomerId(customerId);
  }

  async inviteTeamMember(orgId: string, body: AddTeamMemberDto) {
    const createdUser = await this._organizationRepository.createTeamMember(
      orgId,
      {
        email: body.email,
        password: body.password,
        role: body.role as 'USER' | 'ADMIN',
      }
    );

    if (body.sendEmail) {
      await this._notificationsService.sendEmail(
        body.email,
        'Your team account is ready',
        `An account has been created for you.<br />Email: ${body.email}<br />Temporary password: ${body.password}<br />Please sign in at <a href="${process.env.FRONTEND_URL}/auth/login">${process.env.FRONTEND_URL}/auth/login</a> and change your password on your first login.`
      );
    }
    return { created: true, email: createdUser.email };
  }

  async deleteTeamMember(org: Organization, userId: string) {
    const userOrgs = await this._organizationRepository.getOrgsByUserId(userId);
    const findOrgToDelete = userOrgs.find((orgUser) => orgUser.id === org.id);
    if (!findOrgToDelete) {
      throw new Error('User is not part of this organization');
    }

    // @ts-ignore
    const myRole = org.users[0].role;
    const userRole = findOrgToDelete.users[0].role;
    const myLevel = myRole === 'USER' ? 0 : myRole === 'ADMIN' ? 1 : 2;
    const userLevel = userRole === 'USER' ? 0 : userRole === 'ADMIN' ? 1 : 2;

    if (myLevel < userLevel) {
      throw new Error('You do not have permission to delete this user');
    }

    return this._organizationRepository.deleteTeamMember(org.id, userId);
  }

  async updateTeamMemberRole(
    org: Organization,
    userId: string,
    role: 'USER' | 'ADMIN'
  ) {
    const userOrgs = await this._organizationRepository.getOrgsByUserId(userId);
    const findOrgToUpdate = userOrgs.find((orgUser) => orgUser.id === org.id);
    if (!findOrgToUpdate) {
      throw new Error('User is not part of this organization');
    }

    // @ts-ignore
    const myRole = org.users[0].role;
    const userRole = findOrgToUpdate.users[0].role;
    const myLevel = myRole === 'USER' ? 0 : myRole === 'ADMIN' ? 1 : 2;
    const userLevel = userRole === 'USER' ? 0 : userRole === 'ADMIN' ? 1 : 2;

    if (userRole === 'SUPERADMIN' || myLevel <= userLevel) {
      throw new Error('You do not have permission to update this user');
    }

    return this._organizationRepository.updateTeamMemberRole(
      org.id,
      userId,
      role
    );
  }

  disableOrEnableNonSuperAdminUsers(orgId: string, disable: boolean) {
    return this._organizationRepository.disableOrEnableNonSuperAdminUsers(
      orgId,
      disable
    );
  }

  getShortlinkPreference(orgId: string) {
    return this._organizationRepository.getShortlinkPreference(orgId);
  }

  updateShortlinkPreference(orgId: string, shortlink: ShortLinkPreference) {
    return this._organizationRepository.updateShortlinkPreference(
      orgId,
      shortlink
    );
  }
}
