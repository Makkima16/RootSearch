"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- el contenido generado por la IA no tiene un esquema fijo */

import React from "react";
import {
  LuChevronRight,
  LuFileText,
  LuBookA,
  LuCircleHelp,
  LuListChecks,
  LuPlus,
  LuTrash2,
  LuCheck,
} from "react-icons/lu";
import { StatusChip, Tabs } from "./ui";

export type ContentTab = "resumen" | "glosario" | "quiz" | "checklist";

export interface GeneratedContentData {
  resumen: string;
  glosario: any[];
  quiz: any[];
  checklist: any[];
}

export interface EditableContent {
  resumen: string;
  glosario: any[];
  checklist: any[];
}

/* ------------------------------------------------------------------ */
/* Lista de materiales generados de un curso                           */
/* ------------------------------------------------------------------ */

interface GeneratedContentListProps {
  items: any[];
  onSelect: (item: any, index: number) => void;
}

export function GeneratedContentList({ items, onSelect }: GeneratedContentListProps) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-rs-muted">Cargando contenidos generados...</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((content: any, index: number) => (
        <li key={content._id}>
          <button
            type="button"
            onClick={() => onSelect(content, index)}
            className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-rs-line bg-white px-4 py-4 text-left transition-colors hover:border-rs-600 hover:bg-[#f3f9f5]"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-rs-900 px-2.5 py-1 text-xs font-bold text-rs-lime">#{index + 1}</span>
                <StatusChip estado={content.estado} />
              </div>
              <p className="text-sm text-rs-ink">
                Generado:{" "}
                {new Date(content.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-rs-muted">
                <span className="inline-flex items-center gap-1.5">
                  <LuFileText className="size-4" aria-hidden="true" /> Resumen: {content.resumen ? "sí" : "no"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LuBookA className="size-4" aria-hidden="true" /> Glosario: {content.glosario?.length || 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LuCircleHelp className="size-4" aria-hidden="true" /> Quiz: {content.quiz?.length || 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LuListChecks className="size-4" aria-hidden="true" /> Checklist: {content.checklist?.length || 0}
                </span>
              </div>
            </div>
            <LuChevronRight
              className="size-5 shrink-0 text-rs-700 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Visor y editor del contenido generado                               */
/* ------------------------------------------------------------------ */

/** El checklist puede venir como texto plano o como objeto {tarea, descripcion, completado}. */
function checklistText(item: any, index: number): string {
  if (typeof item === "string") return item;
  return item?.tarea || item?.item || item?.texto || `Tarea ${index + 1}`;
}

function checklistDone(item: any): boolean {
  return typeof item === "object" && item !== null && Boolean(item.completado || item.completed);
}

const boxClass = "rounded-xl border border-rs-line bg-white px-4 py-3";
const fieldClass =
  "w-full rounded-lg border border-rs-input bg-white px-3 py-2 text-rs-ink focus:border-rs-700 focus:outline-2 focus:outline-rs-700";

interface GeneratedContentTabsProps {
  content: GeneratedContentData;
  tab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
}

/** Barra de pestañas con los conteos de cada sección. */
export function GeneratedContentTabs({ content, tab, onTabChange }: GeneratedContentTabsProps) {
  return (
    <Tabs<ContentTab>
      className="border-b border-rs-line bg-rs-50 px-4 py-2 sm:px-6"
      value={tab}
      onChange={onTabChange}
      tabs={[
        { id: "resumen", label: "Resumen" },
        { id: "glosario", label: `Glosario (${content.glosario.length})` },
        { id: "quiz", label: `Quiz (${content.quiz.length})` },
        { id: "checklist", label: `Checklist (${content.checklist.length})` },
      ]}
    />
  );
}

interface GeneratedContentBodyProps {
  content: GeneratedContentData;
  tab: ContentTab;
  /** Si se pasa, el resumen, el glosario y el checklist se muestran como formulario. */
  editing?: {
    value: EditableContent;
    onChange: (value: EditableContent) => void;
  };
}

export function GeneratedContentBody({ content, tab, editing }: GeneratedContentBodyProps) {
  const empty = (text: string) => <p className="py-8 text-center text-rs-muted">{text}</p>;

  if (tab === "resumen") {
    if (editing) {
      return (
        <textarea
          aria-label="Resumen"
          value={editing.value.resumen}
          onChange={(e) => editing.onChange({ ...editing.value, resumen: e.target.value })}
          className={`${fieldClass} h-64 resize-y`}
          placeholder="Editar resumen..."
        />
      );
    }
    return <div className={`${boxClass} whitespace-pre-wrap break-words leading-relaxed text-rs-ink`}>{content.resumen}</div>;
  }

  if (tab === "glosario") {
    if (editing) {
      const glosario = editing.value.glosario;
      const update = (next: any[]) => editing.onChange({ ...editing.value, glosario: next });
      return (
        <div className="space-y-3">
          {glosario.map((item: any, index: number) => (
            <div key={index} className={`${boxClass} space-y-2`}>
              <input
                type="text"
                aria-label={`Término ${index + 1}`}
                value={item.term || item.termino || ""}
                onChange={(e) => {
                  const next = [...glosario];
                  next[index] = { ...item, term: e.target.value };
                  update(next);
                }}
                className={`${fieldClass} font-semibold`}
                placeholder="Término"
              />
              <textarea
                aria-label={`Definición ${index + 1}`}
                value={item.definition || item.definicion || ""}
                onChange={(e) => {
                  const next = [...glosario];
                  next[index] = { ...item, definition: e.target.value };
                  update(next);
                }}
                className={`${fieldClass} h-20 resize-y text-sm`}
                placeholder="Definición"
              />
              <button
                type="button"
                onClick={() => update(glosario.filter((_, i) => i !== index))}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-rs-error hover:bg-rs-error-bg"
              >
                <LuTrash2 className="size-4" aria-hidden="true" /> Eliminar
              </button>
            </div>
          ))}
          <button type="button" onClick={() => update([...glosario, { term: "", definition: "" }])} className="rs-btn-secondary w-full">
            <LuPlus className="size-4" aria-hidden="true" /> Agregar término
          </button>
        </div>
      );
    }
    if (content.glosario.length === 0) return empty("No hay elementos en el glosario");
    return (
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {content.glosario.map((item: any, index: number) => (
          <div key={index} className="rounded-xl bg-rs-100 px-4 py-3">
            <dt className="font-semibold text-rs-900">{item.term || item.termino || `Término ${index + 1}`}</dt>
            <dd className="mt-1 text-sm text-[#2f4a3e]">
              {item.definition || item.definicion || item.description || "Sin definición"}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (tab === "quiz") {
    if (content.quiz.length === 0) return empty("No hay preguntas en el quiz");
    return (
      <div className="space-y-4">
        {content.quiz.map((item: any, index: number) => (
          <fieldset key={index} className={boxClass}>
            <legend className="sr-only">Pregunta {index + 1}</legend>
            <p className="mb-3 font-semibold text-rs-ink">
              {index + 1}. {item.pregunta || item.question || `Pregunta ${index + 1}`}
            </p>
            {item.opciones && Array.isArray(item.opciones) && (
              <ul className="space-y-2">
                {item.opciones.map((opcion: string, optIndex: number) => (
                  <li key={optIndex} className="flex gap-2 rounded-lg border border-rs-line-soft px-3 py-2 text-sm text-rs-ink">
                    <span className="font-semibold text-rs-700">{"ABCD"[optIndex]}</span>
                    <span>{opcion}</span>
                  </li>
                ))}
              </ul>
            )}
            {item.respuesta && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rs-100 px-3 py-1.5 text-sm font-semibold text-rs-800">
                <LuCheck className="size-4" aria-hidden="true" /> Respuesta: {item.respuesta}
              </p>
            )}
            {item.justificacion && <p className="mt-2 text-sm text-rs-muted">{item.justificacion}</p>}
          </fieldset>
        ))}
      </div>
    );
  }

  // checklist
  if (editing) {
    const checklist = editing.value.checklist;
    const update = (next: any[]) => editing.onChange({ ...editing.value, checklist: next });
    return (
      <div className="space-y-3">
        {checklist.map((item: any, index: number) => (
          <div key={index} className={`${boxClass} space-y-2`}>
            <textarea
              aria-label={`Punto ${index + 1}`}
              value={typeof item === "string" ? item : checklistText(item, index)}
              onChange={(e) => {
                const next = [...checklist];
                next[index] = typeof item === "string" ? e.target.value : { ...item, tarea: e.target.value };
                update(next);
              }}
              className={`${fieldClass} h-20 resize-y`}
              placeholder="Punto de checklist"
            />
            <button
              type="button"
              onClick={() => update(checklist.filter((_, i) => i !== index))}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-rs-error hover:bg-rs-error-bg"
            >
              <LuTrash2 className="size-4" aria-hidden="true" /> Eliminar
            </button>
          </div>
        ))}
        <button type="button" onClick={() => update([...checklist, ""])} className="rs-btn-secondary w-full">
          <LuPlus className="size-4" aria-hidden="true" /> Agregar punto
        </button>
      </div>
    );
  }
  if (content.checklist.length === 0) return empty("No hay elementos en el checklist");
  return (
    <ul className="space-y-2">
      {content.checklist.map((item: any, index: number) => (
        <li key={index} className={`${boxClass} flex items-start gap-3`}>
          <input
            type="checkbox"
            disabled
            defaultChecked={checklistDone(item)}
            aria-label={checklistText(item, index)}
            className="mt-1 size-4 shrink-0 accent-rs-700"
          />
          <div>
            <p className="whitespace-pre-wrap break-words text-rs-ink">{checklistText(item, index)}</p>
            {typeof item === "object" && item?.descripcion && (
              <p className="text-sm text-rs-muted">{item.descripcion}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
