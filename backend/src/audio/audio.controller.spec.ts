import { Test, TestingModule } from '@nestjs/testing';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { TranscriptionService } from '../transcription/transcription.service';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('AudioController', () => {
  let controller: AudioController;
  let service: AudioService;
  let transcriptionService: TranscriptionService;

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    roles: ['estudiante'],
  };

  const mockFile = {
    fieldname: 'audio',
    originalname: 'test.mp3',
    filename: 'stored-test.mp3',
    encoding: '7bit',
    mimetype: 'audio/mpeg',
    size: 1024000,
    path: '/tmp/test.mp3',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudioController],
      providers: [
        {
          provide: AudioService,
          useValue: {
            transcribeAudio: jest.fn(),
            processAudioFile: jest.fn(),
          },
        },
        {
          provide: TranscriptionService,
          useValue: {
            create: jest.fn().mockResolvedValue({ _id: 'transcription123' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AudioController>(AudioController);
    service = module.get<AudioService>(AudioService);
    transcriptionService =
      module.get<TranscriptionService>(TranscriptionService);

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe an audio file', async () => {
      const expectedTranscription = 'This is the transcribed text';
      jest
        .spyOn(service, 'transcribeAudio')
        .mockResolvedValue(expectedTranscription);

      const result = await controller.transcribeAudio(
        mockFile as any,
        mockUser,
        { courseId: 'course123' },
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('transcription', expectedTranscription);
      expect(result).toHaveProperty('fileName', 'test.mp3');
      expect(result).toHaveProperty('processingTime');
      expect(service.transcribeAudio).toHaveBeenCalledWith(mockFile.path, 'es');
      expect(transcriptionService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(
        controller.transcribeAudio(undefined as any, mockUser, {
          courseId: 'course123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if courseId is missing', async () => {
      await expect(
        controller.transcribeAudio(mockFile as any, mockUser, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unsupported file types', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'video/mp4',
      };

      await expect(
        controller.transcribeAudio(invalidFile as any, mockUser, {
          courseId: 'course123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file is too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 30 * 1024 * 1024,
      };

      await expect(
        controller.transcribeAudio(largeFile as any, mockUser, {
          courseId: 'course123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle errors from AudioService', async () => {
      const serviceError = new Error('Transcription service failed');
      jest.spyOn(service, 'transcribeAudio').mockRejectedValue(serviceError);

      await expect(
        controller.transcribeAudio(mockFile as any, mockUser, {
          courseId: 'course123',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should clean up temporary files', async () => {
      jest.spyOn(service, 'transcribeAudio').mockResolvedValue('Transcription');

      await controller.transcribeAudio(mockFile as any, mockUser, {
        courseId: 'course123',
      });

      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFile.path);
    });
  });
});
