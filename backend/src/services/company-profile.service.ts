import prisma from '../db/prisma.js';

type CompanyProfilePayload = {
  name: string;
  country: string | null;
  region: string | null;
  city: string | null;
  addressLine: string | null;
  phone: string | null;
  note: string | null;
};

export class CompanyProfileService {
  static async getActiveProfile() {
    return prisma.companyProfile.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  static async upsertActiveProfile(payload: CompanyProfilePayload) {
    const existing = await this.getActiveProfile();

    if (existing) {
      return prisma.companyProfile.update({
        where: { id: existing.id },
        data: { ...payload, isActive: true },
      });
    }

    return prisma.companyProfile.create({
      data: { ...payload, isActive: true },
    });
  }
}
