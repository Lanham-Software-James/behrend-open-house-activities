import { Type } from '@angular/core';

export type ActivityTheme = 'light' | 'dark';

export type ActivityPreview = { label: string } & (
  | { kind: 'graph'; start: string; finish: string }
  | { kind: 'search'; min: number; max: number; guess: number; caption: string }
  | { kind: 'binary'; bits: readonly { weight: number; value: 0 | 1 }[]; total: number; caption: string }
);

export interface Activity {
  id: string;
  theme: ActivityTheme;
  route: string;
  title: string;
  category: string;
  description: string;
  concept: string;
  actionLabel: string;
  previewComponent: Type<unknown>;
  preview: ActivityPreview;
}

