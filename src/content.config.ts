import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { i18nLoader } from '@astrojs/starlight/loaders';
import { docPatterns, routeFor } from './lib/routes.mjs';

const idFor = ({ entry }: { entry: string }) => {
  const route = routeFor(entry);
  if (route === null) throw new Error(`No site route for ${entry}`);
  return route;
};

export const collections = {
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  docs: defineCollection({
    loader: glob({
      base: '.',
      pattern: docPatterns,
      generateId: idFor,
    }),
    schema: docsSchema({
      extend: z.object({
        domain: z
          .enum([
            'foundations',
            'frontend',
            'backend',
            'data',
            'architecture',
            'infrastructure',
            'security',
            'reliability',
            'testing',
            'ai',
          ])
          .optional(),
        stage: z
          .enum([
            'understand',
            'design',
            'build',
            'verify',
            'ship',
            'operate',
            'improve',
          ])
          .optional(),
        freshness: z.enum(['durable', 'evolving', 'fast-moving']).optional(),
        // outline: structure only, Tommy writes the prose. draft: written, not yet reviewed by Tommy.
        status: z.enum(['outline', 'draft', 'reviewed']).optional(),
        // Position in the learning track. Guides and recipes without one sit after the track.
        track: z.number().int().positive().optional(),
        reviewed: z.coerce.date().optional(),
        concerns: z.array(z.string()).optional(),
      }),
    }),
  }),
  skills: defineCollection({
    loader: glob({
      base: '.',
      pattern: 'skills/*/SKILL.md',
      generateId: idFor,
    }),
    schema: z.object({
      name: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .max(64),
      description: z.string().min(1).max(1024),
      metadata: z.object({ title: z.string(), example: z.string() }),
    }),
  }),
};
