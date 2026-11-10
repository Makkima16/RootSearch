import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ReadStream } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import { ITranscriptor } from '../transcription.interface';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class LocalAdapter implements ITranscriptor {
  constructor(private readonly httpService: HttpService) {}

  async transcribir(
    audioInput: ReadStream | string,
    lang: string,
  ): Promise<string> {
    console.log(
      '💻 Usando Adaptador LOCAL: http://127.0.0.1:8000/api/transcribe',
    );

    const localEndpoint =
      process.env.LOCAL_TRANSCRIPTION_ENDPOINT ||
      'http://127.0.0.1:8000/api/transcribe';

    try {
      let filePath: string;

      // Si recibimos una ruta (string), la usamos
      if (typeof audioInput === 'string') {
        // Si la ruta es relativa, convertirla a absoluta
        if (!path.isAbsolute(audioInput)) {
          filePath = path.resolve(process.cwd(), audioInput);
        } else {
          filePath = audioInput;
        }

        console.log(`📂 Ruta del archivo local: ${filePath}`);

        if (!fs.existsSync(filePath)) {
          throw new Error(`Archivo no encontrado: ${filePath}`);
        }
      } else {
        // Si recibimos un ReadStream, necesitamos saber su ruta
        // En este caso, lanzamos error porque esperamos una ruta
        throw new Error(
          'El adaptador LOCAL requiere una ruta de archivo, no un stream',
        );
      }

      // Preparar el payload JSON que espera el servidor
      const payload = {
        file_path: filePath,
        language: lang || 'es',
      };

      console.log(`� Enviando JSON a ${localEndpoint}:`, payload);

      const response = (await firstValueFrom(
        this.httpService
          .post(localEndpoint, payload, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 600000, // 10 minutos de timeout (Whisper puede tardar)
          })
          .pipe(
            catchError((error) => {
              console.error(
                `❌ Error HTTP: ${error.response?.status} - ${error.response?.statusText}`,
              );
              console.error(`📋 Response data:`, error.response?.data);
              throw new HttpException(
                `Error del servidor local (${error.response?.status}): ${error.message}`,
                error.response?.status || HttpStatus.SERVICE_UNAVAILABLE,
              );
            }),
          ),
      )) as any;

      console.log('✅ Respuesta del servidor local:', response.data);

      // El servidor retorna la transcripción (puede ser en diferentes formatos)
      if (response.data.text) {
        return response.data.text;
      }

      if (response.data.transcription) {
        return response.data.transcription;
      }

      if (typeof response.data === 'string') {
        return response.data;
      }

      // Si es un objeto, intenta convertirlo a string
      return JSON.stringify(response.data);
    } catch (error) {
      console.error(`❌ Error en adaptador LOCAL: ${error.message}`);
      throw new HttpException(
        `Servidor de transcripción local no disponible: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
