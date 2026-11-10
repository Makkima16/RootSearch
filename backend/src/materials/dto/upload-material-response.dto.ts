export class UploadMaterialResponseDto {
  id: string;
  courseId: string;
  type: string;
  title?: string;
  description?: string;
  mime: string;
  size: number;
  status: string;
  accessUrl: string;
  variants?: { resolution: string; accessUrl: string }[];
}
