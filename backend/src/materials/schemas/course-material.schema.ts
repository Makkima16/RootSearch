import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum CourseMaterialType {
  PDF = 'PDF',
  PPTX = 'PPTX',
  VIDEO = 'VIDEO',
}

export enum CourseMaterialStatus {
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class CourseMaterial extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  courseId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploaderId: string;

  @Prop({ enum: CourseMaterialType, required: true })
  type: CourseMaterialType;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mime: string;

  @Prop({ required: true })
  size: number; // bytes

  @Prop({ enum: ['GOOGLE_DRIVE'], required: true })
  storageProvider: string;

  @Prop({ required: true })
  storageRef: string; // path local, ObjectId GridFS o key S3

  @Prop()
  title?: string;

  @Prop()
  description?: string;

  // PDF
  @Prop()
  pages?: number;

  // VIDEO
  @Prop()
  duration?: number; // segundos

  @Prop({
    type: [
      {
        resolution: String,
        storageRef: String,
        size: Number,
        _id: false,
      },
    ],
    default: [],
  })
  variants?: { resolution: string; storageRef: string; size?: number }[];

  @Prop({ enum: CourseMaterialStatus, default: CourseMaterialStatus.READY })
  status: CourseMaterialStatus;
}

export const CourseMaterialSchema =
  SchemaFactory.createForClass(CourseMaterial);
