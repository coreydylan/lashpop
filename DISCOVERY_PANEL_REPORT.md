# Discovery Panel Upgrade Plan

## 1. Current State Analysis
I have analyzed the existing codebase and found two relevant components:
1.  **`src/components/drawers/DiscoverDrawer.tsx`**: The active, older implementation using a Drawer UI.
2.  **`src/components/panel-stack/panels/DiscoveryPanel.tsx`**: An untracked (new/WIP) file using the `PanelStack` architecture. This file is already **90% aligned** with your new requirements.

## 2. Gap Analysis vs. New Requirements

| Requirement | Current `DiscoveryPanel.tsx` Status | Action Required |
| :--- | :--- | :--- |
| **Initial Question** ("Have you visited Lash Pop before?") | **Matched**. Logic handles "Welcome back" + Rebooking question. | Minor copy adjustments to match dictation exactly. |
| **Rebooking Flow** | **Matched**. Opens Services panel & closes Discovery. | Verify exact transition timing. |
| **New/First Time Flow** | **Matched**. Goes to Service Selection. | None. |
| **Service Selection** | **Matched**. Multi-select with correct categories. | Ensure priority sorting (Lashes #1) is robust. |
| **Lash Journey Intro** | **Matched**. Has Philosophy/Story screen. | Update text to match "This is the story with permanent lashes..." tone if provided. |
| **Education vs. Quiz Choice** | **Matched**. Buttons for "Tell me more" vs "Find your look". | None. |
| **Education Path** | **Matched**. Educational content + AI Stub. | Keep AI stub as requested. |
| **Lash Quiz (Version 1)** | **Partial Match**. Currently displays all looks as a list to select. | **UPDATE**: Refactor to **Sequential Flow**. Explain Look 1 -> Look 2 -> Look 3 -> Look 4 -> "Which sounds best?" |
| **Lash Factors (Curl, Length, etc.)** | **Partial Match**. Currently shows hardcoded "Custom" cards. | **UPDATE**: Attempt to fetch these from `serviceSubcategories` (DAM data) as requested, or structure to easily swap in. |
| **Completion / Booking** | **Matched**. "Any questions" (AI) or "Ready to book". | None. |
| **End State** | **Matched**. Opens Services Panel filtered + Docks Discovery Panel. | None. |

## 3. Execution Plan

I will perform the following updates to finalize the `DiscoveryPanel` and replace the old `DiscoverDrawer`:

### Step 1: Refactor Lash Quiz to Sequential Flow
Instead of a single list of buttons, I will create a wizard-like flow for the Lash Quiz V1:
1.  **Look Explainer Screens**: A sequence of 4 screens, each dedicated to one look (Classic, Hybrid, Volume, Wet/Angel) with its specific description and imagery.
2.  **Selection Screen**: After the explainers, a final screen asking "Which one sounds most like what you'd be interested in?" with the 4 options.

### Step 2: Dynamic Lash Factors
I will modify the "Other Factors" screen to attempt to pull "Curl", "Length", etc. from the `serviceSubcategories` data if available. If not immediately available in the DB, I will mock them with the exact structure from the DAM requirements so they can be easily connected later.

### Step 3: Copy & Polish
I will update all text to match your dictated flow exactly:
-   "Have you visited Lash Pop before?"
-   "Welcome back! Are you rebooking..."
-   "What services are you interested in?"

### Step 4: System Integration
-   I will ensure `DiscoveryPanel` is properly registered in the `PanelStack`.
-   I will replace the trigger for the old `DiscoverDrawer` to instead open this new `DiscoveryPanel`.

## 4. Technical Implementation Details
-   **File**: `src/components/panel-stack/panels/DiscoveryPanel.tsx`
-   **State Management**: Use `useState` for the sequential quiz steps.
-   **Navigation**: Ensure the `Back` button works correctly through the new sequential quiz steps.

I am ready to proceed with these changes.

