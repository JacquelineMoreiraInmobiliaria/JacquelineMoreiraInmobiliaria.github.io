import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const feature = z.object({
  label: z.string().min(1),
  category: z.enum(["structural", "exterior"])
});

const properties = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/data/properties" }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    price: z.string().optional(),
    hero: z.object({
      subtitle: z.string().optional(),
      description: z.string().optional(),
      coverImage: z.string().min(1),
      video: z.object({
        enabled: z.boolean().default(false),
        source: z.string().url().optional()
      }).default({ enabled: false })
    }),
    summary: z.array(z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      icon: z.enum(["surface", "home", "bed", "bath", "temperature", "pool", "land", "view", "garage"]).optional(),
      show: z.boolean().default(true)
    })).default([]),
    property: z.object({
      sectionTitle: z.string().optional(),
      headline: z.string().optional(),
      paragraphs: z.array(z.string().min(1)).default([])
    }).default({ paragraphs: [] }),
    gallery: z.object({
      enabled: z.boolean().default(false),
      images: z.array(z.object({
        source: z.string().min(1),
        alt: z.string().optional(),
        visible: z.boolean().default(true)
      })).default([])
    }).default({ enabled: false, images: [] }),
    media: z.object({
      cover: z.string().min(1).optional(),
      sections: z.object({
        property: z.string().min(1).optional(),
        features: z.string().min(1).optional(),
        distances: z.string().min(1).optional(),
        final: z.string().min(1).optional()
      }).default({})
    }).optional(),
    features: z.array(feature).default([]),
    location: z.object({
      enabled: z.boolean().default(false),
      visibleName: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional()
    }).default({ enabled: false }),
    distances: z.object({
      enabled: z.boolean().default(false),
      items: z.array(z.object({
        destination: z.string().min(1),
        distance: z.string().min(1)
      })).default([])
    }).default({ enabled: false, items: [] }),
    contact: z.object({
      useDefault: z.boolean().default(true),
      whatsapp: z.string().optional(),
      email: z.string().email().optional()
    }).default({ useDefault: true })
  })
});

export const collections = { properties };
