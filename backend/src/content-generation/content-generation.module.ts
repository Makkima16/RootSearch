import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LmStudioAdapter } from './adapters/lm-studio.adapter';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { CONTENT_GENERATOR } from './adapters/content-generation.interface';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    LmStudioAdapter,
    OpenAiAdapter,
    {
      provide: CONTENT_GENERATOR,
      inject: [ConfigService, LmStudioAdapter, OpenAiAdapter],
      useFactory: (
        config: ConfigService,
        lmStudioAdapter: LmStudioAdapter,
        openAiAdapter: OpenAiAdapter,
      ) => {
        const mode = config.get<string>('CONTENT_GENERATION_MODE', 'LOCAL');

        if (mode === 'CLOUD') {
          console.log('🧠 Modo de generación de contenido: CLOUD (OpenAI)');
          return openAiAdapter;
        }

        console.log('🧠 Modo de generación de contenido: LOCAL (LM Studio)');
        return lmStudioAdapter;
      },
    },
  ],
  exports: [CONTENT_GENERATOR],
})
export class ContentGenerationModule {}
