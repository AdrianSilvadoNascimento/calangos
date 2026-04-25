import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RoomsService } from './rooms.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ZodValidationPipe } from '../common/pipes';
import { createRoomSchema, updateRoomSchema } from '@enxoval/contracts';
import type { CreateRoomInput, UpdateRoomInput } from '@enxoval/contracts';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get()
  async findAll(@Session() session: UserSession) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) return [];
    return this.roomsService.findAllByCouple(profile.coupleId);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createRoomSchema)) dto: CreateRoomInput,
    @Session() session: UserSession,
  ) {
    const profile = await this.profilesService.getByUserId(session.user.id);
    if (!profile?.coupleId) return null;
    return this.roomsService.create(dto, profile.coupleId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRoomSchema)) dto: UpdateRoomInput,
    @Session() session: UserSession,
  ) {
    return this.roomsService.update(id, dto, session.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Session() session: UserSession) {
    return this.roomsService.remove(id, session.user.id);
  }

  @Put('reorder')
  reorder(@Body() body: { ids: string[] }, @Session() session: UserSession) {
    return this.roomsService.reorder(body.ids, session.user.id);
  }
}
