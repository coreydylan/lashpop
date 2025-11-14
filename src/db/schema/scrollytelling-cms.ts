import { pgTable, varchar, integer, timestamp, text, boolean, jsonb, real, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUM TYPES - Clean, extensible categorization
// ============================================

export const layerTypeEnum = pgEnum('layer_type', [
  'header',
  'surface',
  'drawer',
  'overlay',
  'custom'
]);

export const drawerStateEnum = pgEnum('drawer_state', [
  'closed',
  'docked',
  'open'
]);

export const dockPositionEnum = pgEnum('dock_position', [
  'top',
  'bottom'
]);

export const triggerTypeEnum = pgEnum('trigger_type', [
  'scroll_segment',
  'time',
  'click',
  'viewport_enter',
  'programmatic',
  'prefers_reduced_motion'
]);

export const actionTypeEnum = pgEnum('action_type', [
  'to_state',
  'set_property',
  'tween',
  'show',
  'hide',
  'set_content',
  'play_animation'
]);

export const blockTypeEnum = pgEnum('block_type', [
  'rich_text',
  'image',
  'video',
  'form',
  'quiz',
  'widget',
  'custom'
]);

export const easingEnum = pgEnum('easing', [
  'linear',
  'ease_in',
  'ease_out',
  'ease_in_out',
  'cubic_bezier',
  'spring'
]);

// ============================================
// CORE ENTITIES - Composition & Structure
// ============================================

// Compositions table - Top level container (was "projects")
export const compositions = pgTable('scrollytelling_compositions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  duration: real('duration').default(1000), // Authoring units (0-1000)
  viewport_width: integer('viewport_width').default(1920),
  viewport_height: integer('viewport_height').default(1080),
  version: integer('version').default(1),
  is_published: boolean('is_published').default(false),
  is_draft: boolean('is_draft').default(true),
  parent_id: uuid('parent_id'), // For versioning
  locale: varchar('locale', { length: 10 }).default('en-US'),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  published_at: timestamp('published_at'),
});

// Layers table - Visual and control layers
export const layers = pgTable('scrollytelling_layers', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: layerTypeEnum('type').notNull(),
  z_index: integer('z_index').notNull(), // Visual stacking order
  is_visible: boolean('is_visible').default(true),
  is_locked: boolean('is_locked').default(false),
  properties: jsonb('properties').default({}), // Layer-specific config
  responsive_variants: jsonb('responsive_variants').default({}), // Per-breakpoint overrides
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Tracks table - Timeline tracks per layer
export const tracks = pgTable('scrollytelling_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  layer_id: uuid('layer_id').references(() => layers.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }),
  track_index: integer('track_index').notNull(), // Vertical position in timeline
  is_solo: boolean('is_solo').default(false),
  is_muted: boolean('is_muted').default(false),
  color: varchar('color', { length: 7 }), // Hex color for timeline UI
  created_at: timestamp('created_at').defaultNow(),
});

// Clips table - Bounded ranges on timeline with properties
export const clips = pgTable('scrollytelling_clips', {
  id: uuid('id').defaultRandom().primaryKey(),
  track_id: uuid('track_id').references(() => tracks.id, { onDelete: 'cascade' }).notNull(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }),
  start_position: real('start_position').notNull(), // 0-1000 range
  end_position: real('end_position').notNull(),
  properties: jsonb('properties').notNull(), // Clip-specific properties
  easing: easingEnum('easing').default('linear'),
  is_locked: boolean('is_locked').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Cues table - Control points on timeline (was "keystones")
export const cues = pgTable('scrollytelling_cues', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }),
  position: real('position').notNull(), // Timeline position (0-1000)
  duration: real('duration').default(0), // For spans vs points
  is_marker: boolean('is_marker').default(false), // Visual marker only
  color: varchar('color', { length: 7 }),
  created_at: timestamp('created_at').defaultNow(),
});

// CueActions table - Actions triggered by cues
export const cueActions = pgTable('scrollytelling_cue_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  cue_id: uuid('cue_id').references(() => cues.id, { onDelete: 'cascade' }).notNull(),
  target_layer_id: uuid('target_layer_id').references(() => layers.id),
  target_selector: varchar('target_selector', { length: 255 }), // CSS selector or ID
  action_type: actionTypeEnum('action_type').notNull(),
  value: jsonb('value').notNull(), // Action-specific payload
  priority: integer('priority').default(0), // For collision resolution
  created_at: timestamp('created_at').defaultNow(),
});

// Triggers table - Maps runtime input to timeline progress
export const triggers = pgTable('scrollytelling_triggers', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  type: triggerTypeEnum('type').notNull(),
  selector: varchar('selector', { length: 255 }), // DOM selector if applicable
  range_start: real('range_start').notNull(), // Timeline range start (0-1000)
  range_end: real('range_end').notNull(), // Timeline range end
  policy: jsonb('policy').default({}), // Mapping function config
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

// ============================================
// CONTENT ENTITIES - Reusable blocks
// ============================================

// Blocks table - Content units
export const blocks = pgTable('scrollytelling_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: blockTypeEnum('type').notNull(),
  content: jsonb('content').notNull(), // Block-specific content
  metadata: jsonb('metadata').default({}),
  is_template: boolean('is_template').default(false),
  locale: varchar('locale', { length: 10 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ============================================
// LAYER-SPECIFIC CONFIGURATIONS
// ============================================

// DrawerConfigs table - Drawer-specific properties
export const drawerConfigs = pgTable('scrollytelling_drawer_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  layer_id: uuid('layer_id').references(() => layers.id, { onDelete: 'cascade' }).unique().notNull(),
  dock_position: dockPositionEnum('dock_position').notNull(),
  dock_height_px: integer('dock_height_px').default(60),
  open_height_percent: integer('open_height_percent').default(100), // 0-100
  is_modal: boolean('is_modal').default(false), // Modal vs push content
  has_backdrop: boolean('has_backdrop').default(true),
  backdrop_opacity: real('backdrop_opacity').default(0.5),
  transition_duration: integer('transition_duration').default(300), // ms
  scroll_contained: boolean('scroll_contained').default(true), // Contain scroll when open
  docked_widget_block_id: uuid('docked_widget_block_id').references(() => blocks.id),
  main_content_block_id: uuid('main_content_block_id').references(() => blocks.id),
  collision_priority: integer('collision_priority').default(0), // For multiple drawer conflicts
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// HeaderConfigs table - Header-specific properties
export const headerConfigs = pgTable('scrollytelling_header_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  layer_id: uuid('layer_id').references(() => layers.id, { onDelete: 'cascade' }).unique().notNull(),
  height_px: integer('height_px').default(60),
  is_sticky: boolean('is_sticky').default(true),
  hide_on_scroll_down: boolean('hide_on_scroll_down').default(false),
  transparent_at_top: boolean('transparent_at_top').default(false),
  navigation_block_id: uuid('navigation_block_id').references(() => blocks.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// SurfaceSlides table - Content for surface layer
export const surfaceSlides = pgTable('scrollytelling_surface_slides', {
  id: uuid('id').defaultRandom().primaryKey(),
  layer_id: uuid('layer_id').references(() => layers.id, { onDelete: 'cascade' }).notNull(),
  order_index: integer('order_index').notNull(),
  content_block_id: uuid('content_block_id').references(() => blocks.id),
  background_image: text('background_image'),
  background_color: varchar('background_color', { length: 7 }),
  transition_type: varchar('transition_type', { length: 50 }).default('fade'),
  created_at: timestamp('created_at').defaultNow(),
});

// ============================================
// STATE & RUNTIME
// ============================================

// DrawerStates table - Track drawer state transitions
export const drawerStates = pgTable('scrollytelling_drawer_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  drawer_config_id: uuid('drawer_config_id').references(() => drawerConfigs.id, { onDelete: 'cascade' }).notNull(),
  clip_id: uuid('clip_id').references(() => clips.id, { onDelete: 'cascade' }),
  state: drawerStateEnum('state').notNull(),
  height_override: integer('height_override'), // Override percent for "open" state
  transition_duration: integer('transition_duration'),
  created_at: timestamp('created_at').defaultNow(),
});

// CollisionRules table - Handle layer conflicts
export const collisionRules = pgTable('scrollytelling_collision_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  layer_a_id: uuid('layer_a_id').references(() => layers.id).notNull(),
  layer_b_id: uuid('layer_b_id').references(() => layers.id).notNull(),
  rule_type: varchar('rule_type', { length: 50 }).notNull(), // mutual_exclusive, priority, stack
  priority_winner: uuid('priority_winner').references(() => layers.id),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at').defaultNow(),
});

// ============================================
// TELEMETRY & ANALYTICS
// ============================================

// PlaybackEvents table - Track user interactions
export const playbackEvents = pgTable('scrollytelling_playback_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  composition_id: uuid('composition_id').references(() => compositions.id, { onDelete: 'cascade' }).notNull(),
  session_id: varchar('session_id', { length: 255 }).notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(),
  progress: real('progress').notNull(), // 0-1000
  target_layer_id: uuid('target_layer_id').references(() => layers.id),
  payload: jsonb('payload').default({}),
  created_at: timestamp('created_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const compositionsRelations = relations(compositions, ({ many, one }) => ({
  layers: many(layers),
  tracks: many(tracks),
  clips: many(clips),
  cues: many(cues),
  triggers: many(triggers),
  blocks: many(blocks),
  collisionRules: many(collisionRules),
  playbackEvents: many(playbackEvents),
  parent: one(compositions, {
    fields: [compositions.parent_id],
    references: [compositions.id],
  }),
}));

export const layersRelations = relations(layers, ({ one, many }) => ({
  composition: one(compositions, {
    fields: [layers.composition_id],
    references: [compositions.id],
  }),
  tracks: many(tracks),
  drawerConfig: one(drawerConfigs),
  headerConfig: one(headerConfigs),
  surfaceSlides: many(surfaceSlides),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  composition: one(compositions, {
    fields: [tracks.composition_id],
    references: [compositions.id],
  }),
  layer: one(layers, {
    fields: [tracks.layer_id],
    references: [layers.id],
  }),
  clips: many(clips),
}));

export const clipsRelations = relations(clips, ({ one, many }) => ({
  track: one(tracks, {
    fields: [clips.track_id],
    references: [tracks.id],
  }),
  composition: one(compositions, {
    fields: [clips.composition_id],
    references: [compositions.id],
  }),
  drawerStates: many(drawerStates),
}));

export const cuesRelations = relations(cues, ({ one, many }) => ({
  composition: one(compositions, {
    fields: [cues.composition_id],
    references: [compositions.id],
  }),
  actions: many(cueActions),
}));

export const cueActionsRelations = relations(cueActions, ({ one }) => ({
  cue: one(cues, {
    fields: [cueActions.cue_id],
    references: [cues.id],
  }),
  targetLayer: one(layers, {
    fields: [cueActions.target_layer_id],
    references: [layers.id],
  }),
}));

export const triggersRelations = relations(triggers, ({ one }) => ({
  composition: one(compositions, {
    fields: [triggers.composition_id],
    references: [compositions.id],
  }),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  composition: one(compositions, {
    fields: [blocks.composition_id],
    references: [compositions.id],
  }),
}));

export const drawerConfigsRelations = relations(drawerConfigs, ({ one, many }) => ({
  layer: one(layers, {
    fields: [drawerConfigs.layer_id],
    references: [layers.id],
  }),
  dockedWidget: one(blocks, {
    fields: [drawerConfigs.docked_widget_block_id],
    references: [blocks.id],
  }),
  mainContent: one(blocks, {
    fields: [drawerConfigs.main_content_block_id],
    references: [blocks.id],
  }),
  states: many(drawerStates),
}));

export const headerConfigsRelations = relations(headerConfigs, ({ one }) => ({
  layer: one(layers, {
    fields: [headerConfigs.layer_id],
    references: [layers.id],
  }),
  navigation: one(blocks, {
    fields: [headerConfigs.navigation_block_id],
    references: [blocks.id],
  }),
}));

export const surfaceSlidesRelations = relations(surfaceSlides, ({ one }) => ({
  layer: one(layers, {
    fields: [surfaceSlides.layer_id],
    references: [layers.id],
  }),
  contentBlock: one(blocks, {
    fields: [surfaceSlides.content_block_id],
    references: [blocks.id],
  }),
}));

export const drawerStatesRelations = relations(drawerStates, ({ one }) => ({
  drawerConfig: one(drawerConfigs, {
    fields: [drawerStates.drawer_config_id],
    references: [drawerConfigs.id],
  }),
  clip: one(clips, {
    fields: [drawerStates.clip_id],
    references: [clips.id],
  }),
}));

export const collisionRulesRelations = relations(collisionRules, ({ one }) => ({
  composition: one(compositions, {
    fields: [collisionRules.composition_id],
    references: [compositions.id],
  }),
  layerA: one(layers, {
    fields: [collisionRules.layer_a_id],
    references: [layers.id],
  }),
  layerB: one(layers, {
    fields: [collisionRules.layer_b_id],
    references: [layers.id],
  }),
  winner: one(layers, {
    fields: [collisionRules.priority_winner],
    references: [layers.id],
  }),
}));

export const playbackEventsRelations = relations(playbackEvents, ({ one }) => ({
  composition: one(compositions, {
    fields: [playbackEvents.composition_id],
    references: [compositions.id],
  }),
  targetLayer: one(layers, {
    fields: [playbackEvents.target_layer_id],
    references: [layers.id],
  }),
}));