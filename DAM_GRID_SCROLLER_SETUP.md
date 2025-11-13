# DAM Setup for Grid Scroller Component

## Overview

The Grid Scroller component on the homepage needs images tagged in the DAM system to work properly.

## Required DAM Configuration

### 1. Create Category Structure

In the DAM Tag Categories system, create the following structure:

```
website/
└── grid-scroller
```

**Steps:**
1. Go to DAM > Tags Management
2. Create a new category called **"website"**
   - Name: `website`
   - Display Name: `Website`
   - Description: `Images used on the public website`
   - Color: Choose any color (suggest: `#4F46E5` - purple)

3. Create a subcategory/tag under "website" called **"grid-scroller"**
   - Name: `grid-scroller`
   - Display Name: `Grid Scroller`
   - Description: `Images displayed in the homepage photo grid scroll section`

### 2. Tag Images for Grid Scroller

Once the category structure is created:

1. Select 10-20 high-quality images from your portfolio
2. Tag them with: `website / grid-scroller`
3. Choose **ONE** image to be the "key image" (shown through the archway)
4. Tag that key image with an additional tag: `key-image`

**Recommended Images:**
- High-resolution lash work photos
- Variety of aspect ratios (portrait, landscape, square)
- Professional, well-lit shots
- Showcase your best work

### 3. Key Image Selection

The "key image" is special - it's the first image users see through the archway in the hero section.

**Guidelines for Key Image:**
- Should be a portrait orientation (aspect ratio ~0.75)
- Should be your absolute best/most striking work
- Should have good contrast and visual interest
- Should work well when partially visible through an arch shape

To mark an image as the key image:
1. Find/create a tag called `key-image` under an appropriate category
2. Apply this tag to exactly ONE image in the grid-scroller collection

### 4. Testing

After setup, the API endpoint will return your images:
- Endpoint: `GET /api/dam/grid-scroller`
- Returns: Array of images with URLs, aspect ratios, and key image flag

You can test the endpoint by visiting: `http://localhost:3000/api/dam/grid-scroller`

Expected response:
```json
{
  "images": [
    {
      "id": "...",
      "url": "/path/to/image.jpg",
      "aspectRatio": 0.75,
      "isKeyImage": true,
      "alt": "Image description",
      "width": 800,
      "height": 1067
    },
    // ... more images
  ],
  "count": 12,
  "keyImage": { /* the key image object */ }
}
```

## Current Status

Until the DAM category is created, the component will use **mock images** from the gallery folder. This ensures the feature works immediately while DAM setup is in progress.

## Questions?

Contact the development team if you need help with:
- Creating the category structure
- Tagging images
- Setting up the key image
- Testing the integration
