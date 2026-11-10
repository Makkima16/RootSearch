import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IContentGenerator } from './content-generation.interface';

@Injectable()
export class OpenAiAdapter implements IContentGenerator {
  private readonly logger = new Logger(OpenAiAdapter.name);
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly httpService: HttpService) {}

  async generarResumen(
    transcripcion: string,
    contexto?: string,
  ): Promise<string> {
    const prompt = `
      Actúa como un Profesor Universitario. Genera un RESUMEN ESTRUCTURADO (Markdown) de esta clase.
      Usa títulos (##), negritas y listas. Enfócate en los argumentos principales y conclusiones.
      NO respondas con JSON, solo texto Markdown bien formateado.
    `;
    return this.llamarIA(prompt, transcripcion, 0.4, contexto);
  }

  async generarQuiz(transcripcion: string, contexto?: string): Promise<any[]> {
    const prompt = `
      Genera un QUIZ de 5 preguntas (selección múltiple) basado en el texto.
      Responde ÚNICAMENTE con este JSON: 
      { "quiz": [{ "pregunta": "...", "opciones": [], "respuestaCorrecta": "...", "justificacion": "..." }] }
    `;
    const json = await this.llamarIA(prompt, transcripcion, 0.2, contexto);
    return this.parsearJson(json, 'quiz');
  }

  async generarGlosario(
    transcripcion: string,
    contexto?: string,
  ): Promise<any[]> {
    const prompt = `Extrae un GLOSARIO (JSON): { "glosario": [{ "term": "...", "definition": "..." }] }`;
    const json = await this.llamarIA(prompt, transcripcion, 0.2, contexto);
    return this.parsearJson(json, 'glosario');
  }

  async generarChecklist(
    transcripcion: string,
    contexto?: string,
  ): Promise<string[]> {
    const prompt = `
      Crea una CHECKLIST de 5 a 7 puntos clave para estudiar este tema.
      Responde ÚNICAMENTE con un JSON válido con esta estructura:
      { "checklist": ["Punto 1", "Punto 2"] }
    `;
    const json = await this.llamarIA(prompt, transcripcion, 0.3, contexto);
    return this.parsearJson(json, 'checklist');
  }

  async calcularAlineacion(
    transcripcion: string,
    contexto: string,
  ): Promise<{ score: number; analisis: string }> {
    const prompt = `
      Analiza qué tanto se alinea el contenido de esta clase (transcripción) con el Plan de Estudios (Syllabus) proporcionado en el contexto.
      Evalúa si se cubrieron los temas esperados.
      Responde ÚNICAMENTE con este JSON:
      { 
        "piaa_alignment": { 
          "score": 85, 
          "analisis": "Breve explicación de 2 frases sobre qué temas del syllabus se cubrieron y cuáles faltaron." 
        } 
      }
      El score debe ser un número entre 0 y 100.
    `;
    const json = await this.llamarIA(prompt, transcripcion, 0.1, contexto);
    return this.parsearJson(json, 'piaa_alignment');
  }

  // --- UTILIDADES GENÉRICAS ---

  private async llamarIA(
    systemPrompt: string,
    userContent: string,
    temp: number,
    contexto?: string,
  ): Promise<string> {
    let finalSystemPrompt = systemPrompt;
    if (contexto) {
      finalSystemPrompt += `\n\nCONTEXTO DEL PLAN DE ESTUDIOS (SYLLABUS):\n${contexto}\nUsa este contexto para mejorar la precisión y relevancia de tu respuesta.`;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada en el archivo .env');
    }

    try {
      const { data } = (await firstValueFrom(
        this.httpService.post(
          this.apiUrl,
          {
            model: 'gpt-4o-mini', // Modelo rápido y económico
            messages: [
              { role: 'system', content: finalSystemPrompt },
              { role: 'user', content: userContent },
            ],
            temperature: temp,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      )) as any;
      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error(
        'Error llamando a OpenAI',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  private parsearJson(textoRaw: string, key: string): any {
    let limpio = textoRaw.trim();
    try {
      // Limpieza agresiva de bloques de código markdown (Case insensitive)
      limpio = limpio.replace(/```json/gi, '').replace(/```/g, '');

      // Búsqueda de llaves
      const inicio = limpio.indexOf('{');
      const fin = limpio.lastIndexOf('}');
      if (inicio !== -1 && fin !== -1) {
        limpio = limpio.substring(inicio, fin + 1);
      }

      const objeto = JSON.parse(limpio);
      return objeto[key] || []; // Devolvemos solo el array interno
    } catch (e) {
      this.logger.warn(
        `Fallo al parsear JSON para ${key}. Error: ${e.message}. Intentado: ${limpio.substring(0, 100)}...`,
      );
      return []; // Fallback seguro para no romper todo el proceso
    }
  }
}
