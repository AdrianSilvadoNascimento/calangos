import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { invites, couples, profiles } from '@enxoval/db/schema';
import { DB_TOKEN } from '../database/database.module';
import type { DB } from '../database/database.module';
import type { AcceptInviteInput } from '@enxoval/contracts';
import { auth } from '../auth/auth';
import { serverEnv } from '@enxoval/env/server';

const INVITE_TTL_DAYS = 14;
const MAX_MEMBERS = 2;

@Injectable()
export class InvitesService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async createForUser(userId: string, email?: string) {
    const profile = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (!profile?.coupleId) throw new ForbiddenException('No couple linked');

    const memberCount = await this.countMembers(profile.coupleId);
    if (memberCount >= MAX_MEMBERS) {
      throw new ConflictException('Este enxoval já está completo.');
    }

    const existing = await this.findActiveForCouple(profile.coupleId);
    if (existing) {
      if (email && existing.email !== email) {
        await this.db
          .update(invites)
          .set({ email })
          .where(eq(invites.id, existing.id));
        existing.email = email;
      }
      return this.withLink(existing);
    }

    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const [invite] = await this.db
      .insert(invites)
      .values({
        coupleId: profile.coupleId,
        email: email ?? null,
        token,
        createdBy: userId,
        expiresAt,
      })
      .returning();

    return this.withLink(invite);
  }

  async findByToken(token: string) {
    const invite = await this.db.query.invites.findFirst({
      where: eq(invites.token, token),
    });
    if (!invite) throw new NotFoundException('Convite não encontrado.');

    const couple = await this.db.query.couples.findFirst({
      where: eq(couples.id, invite.coupleId),
    });

    const expired = invite.expiresAt.getTime() < Date.now();

    return {
      coupleId: invite.coupleId,
      coupleName: couple?.name ?? null,
      email: invite.email,
      expired,
      used: !!invite.usedAt,
    };
  }

  async accept(token: string, dto: AcceptInviteInput) {
    const invite = await this.db.query.invites.findFirst({
      where: eq(invites.token, token),
    });
    if (!invite) throw new NotFoundException('Convite não encontrado.');
    if (invite.usedAt) throw new ConflictException('Convite já utilizado.');
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Convite expirado.');
    }
    if (invite.email && invite.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException('Email diferente do convite.');
    }

    const memberCount = await this.countMembers(invite.coupleId);
    if (memberCount >= MAX_MEMBERS) {
      throw new ConflictException('Este enxoval já está completo.');
    }

    const signUp = await auth.api.signUpEmail({
      body: {
        email: dto.email,
        password: dto.password,
        name: dto.name,
      },
    });

    const userId = signUp.user.id;

    await this.db
      .insert(profiles)
      .values({
        userId,
        coupleId: invite.coupleId,
        displayName: dto.name,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { coupleId: invite.coupleId, displayName: dto.name },
      });

    await this.db
      .update(invites)
      .set({ usedAt: new Date() })
      .where(eq(invites.id, invite.id));

    return { userId, coupleId: invite.coupleId };
  }

  async countMembers(coupleId: string) {
    const members = await this.db.query.profiles.findMany({
      where: eq(profiles.coupleId, coupleId),
    });
    return members.length;
  }

  private async findActiveForCouple(coupleId: string) {
    return this.db.query.invites.findFirst({
      where: and(
        eq(invites.coupleId, coupleId),
        isNull(invites.usedAt),
        gt(invites.expiresAt, new Date()),
      ),
    });
  }

  private withLink(invite: { token: string; email: string | null; expiresAt: Date }) {
    const scheme = serverEnv.APP_SCHEME;
    return {
      token: invite.token,
      email: invite.email,
      expiresAt: invite.expiresAt,
      link: `${scheme}://invite?token=${invite.token}`,
    };
  }
}
