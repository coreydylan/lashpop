import { NextRequest, NextResponse } from 'next/server';
import { db, compositions, layers, tracks, clips, cues, cueActions, triggers, blocks } from '@/db';
import { eq } from 'drizzle-orm';

// ============================================
// API ENDPOINTS - Composition CRUD
// ============================================

// GET /api/scrollytelling/compositions - List all compositions
// GET /api/scrollytelling/compositions?id=xxx - Get specific composition
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compositionId = searchParams.get('id');

    if (compositionId) {
      // Get specific composition with all related data
      const composition = await loadFullComposition(compositionId);

      if (!composition) {
        return NextResponse.json(
          { error: 'Composition not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(composition);
    } else {
      // List all compositions (metadata only)
      const allCompositions = await db.select().from(compositions);
      return NextResponse.json(allCompositions);
    }
  } catch (error) {
    console.error('Error fetching compositions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compositions' },
      { status: 500 }
    );
  }
}

// POST /api/scrollytelling/compositions - Create new composition
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Create composition
    const [newComposition] = await db.insert(compositions).values({
      name: data.name,
      description: data.description,
      duration: data.duration || 1000,
      viewport_width: data.viewport_width || 1920,
      viewport_height: data.viewport_height || 1080,
      metadata: data.metadata || {}
    }).returning();

    // Create default layers
    const defaultLayers = [
      { name: 'Header', type: 'header' as const, z_index: 1000 },
      { name: 'Surface', type: 'surface' as const, z_index: 0 },
      { name: 'Primary Drawer', type: 'drawer' as const, z_index: 100 }
    ];

    for (const layerData of defaultLayers) {
      const [layer] = await db.insert(layers).values({
        composition_id: newComposition.id,
        name: layerData.name,
        type: layerData.type,
        z_index: layerData.z_index
      }).returning();

      // Create track for each layer
      await db.insert(tracks).values({
        composition_id: newComposition.id,
        layer_id: layer.id,
        track_index: layerData.z_index
      });
    }

    // Load and return the full composition
    const fullComposition = await loadFullComposition(newComposition.id);
    return NextResponse.json(fullComposition, { status: 201 });
  } catch (error) {
    console.error('Error creating composition:', error);
    return NextResponse.json(
      { error: 'Failed to create composition' },
      { status: 500 }
    );
  }
}

// PUT /api/scrollytelling/compositions - Update composition
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Composition ID required' },
        { status: 400 }
      );
    }

    // Update composition
    await db.update(compositions)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(compositions.id, id));

    // Handle nested updates if provided
    if (data.layers) {
      // Update layers logic
    }

    if (data.cues) {
      // Update cues logic
    }

    if (data.triggers) {
      // Update triggers logic
    }

    // Load and return updated composition
    const updatedComposition = await loadFullComposition(id);
    return NextResponse.json(updatedComposition);
  } catch (error) {
    console.error('Error updating composition:', error);
    return NextResponse.json(
      { error: 'Failed to update composition' },
      { status: 500 }
    );
  }
}

// DELETE /api/scrollytelling/compositions?id=xxx - Delete composition
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compositionId = searchParams.get('id');

    if (!compositionId) {
      return NextResponse.json(
        { error: 'Composition ID required' },
        { status: 400 }
      );
    }

    // Delete composition (cascades to related tables)
    await db.delete(compositions).where(eq(compositions.id, compositionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting composition:', error);
    return NextResponse.json(
      { error: 'Failed to delete composition' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function loadFullComposition(compositionId: string) {
  // Get composition
  const [composition] = await db.select()
    .from(compositions)
    .where(eq(compositions.id, compositionId));

  if (!composition) return null;

  // Get layers
  const compositionLayers = await db.select()
    .from(layers)
    .where(eq(layers.composition_id, compositionId));

  // Get tracks with clips
  const compositionTracks = await db.select()
    .from(tracks)
    .where(eq(tracks.composition_id, compositionId));

  const compositionClips = await db.select()
    .from(clips)
    .where(eq(clips.composition_id, compositionId));

  // Get cues with actions
  const compositionCues = await db.select()
    .from(cues)
    .where(eq(cues.composition_id, compositionId));

  const allCueActions = await Promise.all(
    compositionCues.map(async (cue: typeof cues.$inferSelect) => {
      const actions = await db.select()
        .from(cueActions)
        .where(eq(cueActions.cue_id, cue.id));
      return { ...cue, actions };
    })
  );

  // Get triggers
  const compositionTriggers = await db.select()
    .from(triggers)
    .where(eq(triggers.composition_id, compositionId));

  // Get blocks
  const compositionBlocks = await db.select()
    .from(blocks)
    .where(eq(blocks.composition_id, compositionId));

  // Assemble tracks with their clips
  const tracksWithClips = compositionTracks.map((track: typeof tracks.$inferSelect) => ({
    ...track,
    clips: compositionClips.filter((clip: typeof clips.$inferSelect) => clip.track_id === track.id)
  }));

  return {
    ...composition,
    layers: compositionLayers,
    tracks: tracksWithClips,
    cues: allCueActions,
    triggers: compositionTriggers,
    blocks: compositionBlocks
  };
}