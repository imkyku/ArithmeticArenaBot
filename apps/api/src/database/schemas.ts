import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true }) telegramId!: string;
  @Prop() username?: string;
  @Prop() firstName?: string;
  @Prop() lastName?: string;
  @Prop() avatarUrl?: string;
  @Prop({ default: Date.now }) lastSeenAt!: Date;
  @Prop({ type: Object, default: {} }) flags!: Record<string, unknown>;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true }) userId!: Types.ObjectId;
  @Prop({ default: 1000 }) rating!: number;
  @Prop({ default: 0 }) gamesPlayed!: number;
  @Prop({ default: 0 }) wins!: number;
  @Prop({ default: 0 }) losses!: number;
  @Prop({ default: 0 }) draws!: number;
}
export const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ rating: -1, updatedAt: -1 });

@Schema({ timestamps: true })
export class Match {
  @Prop({ enum: ['ranked', 'friendly'], required: true }) type!: 'ranked' | 'friendly';
  @Prop({ enum: ['waiting', 'active', 'finished', 'cancelled'], index: true }) status!: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true }) playerIds!: Types.ObjectId[];
  @Prop({ required: true }) startNumber!: string;
  @Prop({ required: true }) targetNumber!: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) winnerId?: Types.ObjectId;
  @Prop() resultType?: 'exact' | 'closest' | 'surrender' | 'draw';
  @Prop() startedAt?: Date;
  @Prop() finishedAt?: Date;
  @Prop() durationMs?: number;
  @Prop({ type: Object }) finalDistances?: Record<string, string>;
  @Prop({ type: Object }) ratingChanges?: Record<string, number>;
  @Prop() inviteCode?: string;
  @Prop({ type: Object }) generationMetadata?: Record<string, unknown>;
}
export const MatchSchema = SchemaFactory.createForClass(Match);
MatchSchema.index({ status: 1, createdAt: -1 });

@Schema({ timestamps: true })
export class MatchSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Match', index: true }) matchId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', index: true }) userId!: Types.ObjectId;
  @Prop({ required: true }) currentValue!: string;
  @Prop({ default: 10 }) storedElixir!: number;
  @Prop({ required: true }) lastElixirUpdateAt!: Date;
  @Prop({ default: true }) connected!: boolean;
  @Prop({ default: false }) surrendered!: boolean;
}
export const MatchSnapshotSchema = SchemaFactory.createForClass(MatchSnapshot);

@Schema({ timestamps: true })
export class MatchMove {
  @Prop({ type: Types.ObjectId, ref: 'Match', index: true }) matchId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) userId!: Types.ObjectId;
  @Prop({ required: true }) seq!: number;
  @Prop({ enum: ['add', 'sub', 'mul', 'div'] }) operationType!: string;
  @Prop() operand!: string;
  @Prop() cost!: number;
  @Prop() beforeValue!: string;
  @Prop() afterValue!: string;
  @Prop() rejectedReason?: string;
}
export const MatchMoveSchema = SchemaFactory.createForClass(MatchMove);
MatchMoveSchema.index({ matchId: 1, createdAt: -1 });

@Schema({ timestamps: true })
export class Season {
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) startsAt!: Date;
  @Prop({ required: true }) endsAt!: Date;
  @Prop({ default: true }) active!: boolean;
}
export const SeasonSchema = SchemaFactory.createForClass(Season);

@Schema({ timestamps: true })
export class LeaderboardCacheMeta {
  @Prop() seasonId?: string;
  @Prop({ required: true }) generatedAt!: Date;
  @Prop({ required: true }) expiresAt!: Date;
}
export const LeaderboardCacheMetaSchema = SchemaFactory.createForClass(LeaderboardCacheMeta);
LeaderboardCacheMetaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

@Schema({ timestamps: true })
export class AuditEvent {
  @Prop({ required: true }) type!: string;
  @Prop() actor?: string;
  @Prop({ type: Object }) context?: Record<string, unknown>;
  @Prop({ enum: ['info', 'warn', 'critical'], default: 'info' }) severity!: string;
}
export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);
AuditEventSchema.index({ createdAt: -1 });
