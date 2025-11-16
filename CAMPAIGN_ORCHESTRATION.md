# AI Campaign Orchestration System

> **Vision**: Multi-agent AI system that creates complete, brand-compliant campaigns from a creative brief, with parallel generation, quality control, and iterative refinement.

**Status**: Phase 1 - Basic Campaign Generator ✅
**Codename**: "CONDUCTOR" (Campaign Orchestration Network for Distributed Understanding, Creation, Testing, Optimization, and Refinement)

---

## 🎭 Architecture Overview

### Multi-Agent System

```
                    ┌─────────────────┐
                    │   CONDUCTOR     │
                    │  (Master Agent) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐
   │Generation│        │ Quality  │        │ Refine   │
   │ Agents   │        │ Control  │        │  Agent   │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                    │
   (Parallel)           (Validation)        (Iterative)
```

---

## 📁 File Structure

```
src/
├── db/schema/
│   ├── campaigns.ts              # Campaign database schema
│   ├── campaign_assets.ts        # Campaign asset tracking
│   └── campaign_templates.ts     # Reusable templates
│
├── types/
│   └── campaign.ts                # TypeScript types for campaign system
│
├── lib/ai/
│   ├── conductor-agent.ts         # Master orchestrator agent
│   ├── generation-agent.ts        # Specialist generation agents
│   └── quality-control-agent.ts   # Brand compliance checker
│
├── app/api/campaigns/
│   ├── route.ts                   # List/create campaigns
│   ├── [id]/route.ts              # Get/update/delete campaign
│   └── [id]/generate/route.ts     # AI generation orchestration
│
└── app/dam/campaigns/
    └── page.tsx                   # Campaign UI
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk openai zod
```

### 2. Set Environment Variables

```env
# .env.local
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
DATABASE_URL=your_database_url_here
```

### 3. Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access Campaign Orchestration

Navigate to: `http://localhost:3000/dam/campaigns`

---

## 📊 Database Schema

### `campaigns` Table

Stores campaign metadata and orchestration state:

- **Basic Info**: name, description, objective, status
- **User Inputs**: brandAssets, inspiration, requirements
- **AI-Generated**: creativeBrief (full visual/copy direction)
- **Metadata**: generationMetadata (cost, time, iterations)

### `campaign_assets` Table

Tracks each generated asset:

- **Specification**: role, purpose, platform, variant
- **Generation**: prompt, model, cost, time, attempts
- **Quality Control**: scores, checks, feedback
- **Refinement**: history of iterations and improvements

### `campaign_templates` Table

Reusable campaign templates:

- **Structure**: phases, timeline, deliverables
- **Variables**: required inputs (brand assets, inspiration)
- **Instructions**: AI guidance for generation

---

## 🤖 AI Agents

### 1. Conductor Agent

**File**: `src/lib/ai/conductor-agent.ts`

**Model**: Claude Sonnet 4.5

**Responsibilities**:
- Analyze brand assets (logos, colors, typography, guidelines)
- Analyze inspiration (photos, style refs, mood boards)
- Synthesize into comprehensive creative brief
- Generate detailed specs for each asset

**Methods**:
```typescript
class ConductorAgent {
  async createDetailedBrief(
    input: CampaignBriefInput,
    brandAssets: any[],
    inspirationAssets: any[]
  ): Promise<CreativeBrief>

  private async analyzeBrandAssets(): Promise<BrandAnalysis>
  private async analyzeInspiration(): Promise<InspirationAnalysis>
  private async synthesizeBrief(): Promise<CreativeBrief>
  private async generateAssetSpecs(): Promise<AssetSpec[]>
}
```

**Example Output**:
```json
{
  "visualDirection": {
    "colorPalette": {
      "primary": "#FF6B9D",
      "secondary": "#C9E4CA",
      "accent": "#FFF8DC",
      "rationale": "Summer palette warmth with brand pink, balanced by fresh mint"
    },
    "composition": {
      "style": "Clean, minimal product focus with lifestyle context",
      "layout": "Rule of thirds, breathing room, playful asymmetry",
      "lighting": "Bright, natural, soft shadows, golden hour feel"
    },
    "mood": {
      "primary": "Joyful, carefree summer energy",
      "secondary": "Aspirational but approachable",
      "avoid": ["Too serious", "Too dark", "Too cluttered"]
    }
  },
  "assets": [
    {
      "id": "asset-1",
      "type": "photo",
      "purpose": "Hero campaign image",
      "role": "hero",
      "specs": {
        "ratio": "4:5",
        "composition": "Product + lifestyle, summer setting",
        "mood": "Joyful energy",
        "colorEmphasis": "#FF6B9D"
      },
      "prompt": "Professional product photography of summer lash extensions..."
    }
  ]
}
```

### 2. Specialist Generation Agents

**File**: `src/lib/ai/generation-agent.ts`

**Model**: DALL-E 3 HD

**Responsibilities**:
- Interpret asset spec from creative brief
- Select optimal AI model
- Craft perfect generation prompt
- Generate with retry logic (up to 3 attempts)
- Return asset with metadata

**Usage**:
```typescript
const agent = new SpecialistGenerationAgent({
  spec: assetSpec,
  brief: creativeBrief
})

const result = await agent.generate()
// Returns: { assetId, url, role, platform, status, metadata }
```

**Parallel Generation**:
```typescript
const orchestrator = new ParallelGenerationOrchestrator(brief, maxConcurrent: 5)

const assets = await orchestrator.generateAll((progress) => {
  console.log(`${progress.completed}/${progress.total} complete`)
})
```

### 3. Quality Control Agent

**File**: `src/lib/ai/quality-control-agent.ts`

**Model**: Claude Sonnet 4.5 (with vision)

**Responsibilities**:
- Check brand alignment (colors, mood, composition)
- Validate visual quality
- Verify accessibility (WCAG AA)
- Check technical specs
- Generate actionable feedback

**Usage**:
```typescript
const qc = new QualityControlAgent()

const result = await qc.validateAsset(generatedAsset, creativeBrief)
// Returns: { assetId, passed, score, checks, feedback, requiresRefinement }
```

**Quality Checks**:
1. **Brand Alignment** (0.80+ required)
   - Color palette match
   - Mood alignment
   - Composition style
   - Required elements present
   - No prohibited elements

2. **Visual Quality** (0.90+ required)
   - Resolution meets requirements
   - Image sharpness
   - Appropriate lighting
   - Balanced composition

3. **Accessibility**
   - Color contrast (WCAG AA)
   - Text readability
   - Alt text presence

4. **Technical Specs**
   - Resolution
   - Format
   - Color space
   - File size

---

## 🔄 Campaign Generation Workflow

### Step 1: Create Campaign Brief

**Endpoint**: `POST /api/campaigns`

```typescript
const brief: CampaignBriefInput = {
  campaignName: "Summer Lash Collection 2025",
  objective: "Launch new summer lash styles, target Gen Z",
  platforms: ['instagram', 'tiktok'],

  brandAssets: {
    logos: ['asset-id-1'],
    colors: ['asset-id-2'],
    typography: ['asset-id-3']
  },

  inspiration: {
    photos: ['asset-id-4', 'asset-id-5'],
    styleReferences: ['asset-id-6']
  },

  requirements: {
    deliverables: [
      'Hero campaign image',
      '5 product highlight posts',
      '3 lifestyle posts',
      '10 Instagram stories'
    ],
    budget: 50 // in dollars
  }
}

const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(brief)
})
```

### Step 2: Generate Campaign

**Endpoint**: `POST /api/campaigns/{id}/generate`

```typescript
const response = await fetch(`/api/campaigns/${campaignId}/generate`, {
  method: 'POST'
})

// Returns:
{
  success: true,
  campaign: {
    id: "campaign-id",
    status: "review",
    generatedAssets: 18,
    passedQC: 16,
    failedQC: 2
  }
}
```

**Behind the scenes**:

1. **Status**: `generating_brief`
   - Conductor analyzes brand assets
   - Conductor analyzes inspiration
   - Conductor creates detailed brief

2. **Status**: `brief_ready`
   - Brief saved to database
   - Asset specs generated

3. **Status**: `generating_assets`
   - Parallel generation (5 concurrent)
   - Progress tracking
   - Retry logic for failures

4. **Status**: `quality_check`
   - Batch QC validation
   - Score each asset
   - Generate feedback

5. **Status**: `review`
   - Assets saved to database
   - Ready for human review

### Step 3: Review & Approve

**UI**: `/dam/campaigns/{id}`

View generated assets with:
- Quality scores
- QC feedback
- Generation metadata (cost, time, model)
- Approve/reject/regenerate actions

---

## 💰 Cost Estimation

### DALL-E 3 HD Pricing

- **1024x1024** (Square): $0.08 per image
- **1024x1792** (Portrait/Story): $0.12 per image
- **1792x1024** (Landscape): $0.12 per image

### Claude Sonnet 4.5 Pricing

- **Input**: $3.00 per million tokens
- **Output**: $15.00 per million tokens

### Example Campaign Cost

**20 assets** with detailed brief:
- Conductor brief generation: ~$0.15 (5K tokens)
- 20x DALL-E 3 images (mixed sizes): ~$2.00
- 20x QC validations: ~$0.30 (2K tokens each)
- **Total**: ~$2.45

**With refinement** (30% failure rate):
- 6 regenerations: ~$0.60
- **Total**: ~$3.05

---

## 🎯 Next Steps (Roadmap)

### Phase 2: Quality Control & Refinement ⏳

- [ ] Implement refinement agent
- [ ] Auto-regenerate failed assets
- [ ] Iterative improvement loop
- [ ] Confidence scoring

### Phase 3: Template System

- [ ] Pre-built campaign templates
- [ ] Custom template creation
- [ ] Template marketplace
- [ ] Variable substitution

### Phase 4: Advanced Features

- [ ] Real-time progress updates (WebSocket/SSE)
- [ ] A/B variant generation
- [ ] Performance prediction
- [ ] Cross-campaign learning
- [ ] Video generation support

### Phase 5: Integration

- [ ] Social media scheduling
- [ ] Asset distribution
- [ ] Analytics integration
- [ ] Collaboration features

---

## 🔧 Development Guide

### Adding a New AI Model

1. Create agent in `src/lib/ai/`:
```typescript
export class MyCustomAgent {
  private client: SomeAIClient

  async process(input: InputType): Promise<OutputType> {
    // Implementation
  }
}
```

2. Add to orchestration in `src/app/api/campaigns/[id]/generate/route.ts`

3. Update types in `src/types/campaign.ts`

### Adding Quality Checks

1. Add check method to `QualityControlAgent`:
```typescript
private async checkNewCriteria(
  asset: GeneratedAsset,
  brief: CreativeBrief
): Promise<QualityCheck> {
  // Implementation
}
```

2. Add to `validateAsset` parallel checks array

3. Update threshold in `CreativeBrief` type

### Testing Locally

```bash
# Set test mode
export NODE_ENV=development

# Test conductor
npm run test:conductor

# Test generation
npm run test:generation

# Test full workflow
npm run test:campaign
```

---

## 📝 API Reference

### Campaign Endpoints

#### `GET /api/campaigns`
List all campaigns with optional filters

**Query params**:
- `status`: Filter by status
- `objective`: Filter by objective

**Response**:
```json
{
  "success": true,
  "campaigns": [...]
}
```

#### `POST /api/campaigns`
Create new campaign

**Body**: `CampaignBriefInput`

**Response**:
```json
{
  "success": true,
  "campaign": {...}
}
```

#### `GET /api/campaigns/{id}`
Get campaign with all assets

**Response**:
```json
{
  "success": true,
  "campaign": {...},
  "assets": [...]
}
```

#### `PATCH /api/campaigns/{id}`
Update campaign

**Body**: Partial campaign data

#### `DELETE /api/campaigns/{id}`
Delete campaign (cascades to assets)

#### `POST /api/campaigns/{id}/generate`
Generate campaign assets with AI orchestration

**Response**:
```json
{
  "success": true,
  "campaign": {
    "id": "...",
    "status": "review",
    "generatedAssets": 18,
    "passedQC": 16,
    "failedQC": 2
  }
}
```

---

## 🐛 Troubleshooting

### Generation Fails

**Issue**: Assets fail to generate

**Solutions**:
1. Check API keys are set correctly
2. Verify internet connectivity
3. Check DALL-E rate limits
4. Review error logs in database

### Low Quality Scores

**Issue**: Assets consistently fail QC

**Solutions**:
1. Improve brand asset descriptions
2. Add more detailed inspiration
3. Refine deliverable specifications
4. Adjust quality thresholds

### Slow Generation

**Issue**: Generation takes too long

**Solutions**:
1. Reduce concurrent generation limit
2. Decrease number of deliverables
3. Use faster models for non-critical assets
4. Implement caching for brand analysis

---

## 📚 Resources

- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [OpenAI DALL-E API Docs](https://platform.openai.com/docs/guides/images)
- [Campaign Orchestration Spec](./docs/CAMPAIGN_SPEC.md) (full design doc)

---

## 🤝 Contributing

This is Phase 1 of the campaign orchestration system. Future phases will add:
- Refinement loops
- Template system
- Predictive analytics
- Real-time collaboration
- Video generation

See `ROADMAP.md` for details.

---

**Built with ❤️ using Claude Sonnet 4.5 and DALL-E 3**
