# Git-vilization Implementation Plan

## Phase 1: Project Setup
- [x] Create PRD.md
- [x] Initialize Next.js project with TypeScript
- [x] Install dependencies (three, @react-three/fiber, @react-three/drei, zustand)
- [x] Set up project structure (src/components, src/hooks, src/store, etc.)
- [x] Create basic layout and pages

## Phase 2: Game Engine (Python)
- [x] Create engine/ directory structure
- [x] Define gamestate.json schema (schemas.py)
- [x] Implement game state management (state.py)
- [x] Implement game rules (rules.py)
  - [x] Territory system
  - [x] Resource management (gold)
  - [x] Unit movement validation
  - [x] Combat resolution
  - [x] Building placement
  - [x] Training units
  - [x] Harvesting
  - [x] Settling
- [x] Implement move validation (validate.py)
- [x] Create main.py entry point for CI/CD
- [x] Create initial gamestate.json with starting positions
- [x] Write unit tests for engine (21 tests passing)

## Phase 3: Tribe Strategy Interface
- [x] Create tribes/ directory with red/blue/green/yellow subdirectories
- [x] Create strategy.py template for each tribe
- [x] Document the API for Jules (in strategy.py docstrings)

## Phase 4: 3D Frontend - Core
- [x] Set up React Three Fiber canvas
- [x] Implement hex grid coordinate system (axial coordinates)
- [x] Create HexTile component with terrain types
- [x] Create HexGrid component (20x20 grid)
- [x] Add OrbitControls for camera
- [x] Add basic lighting and environment

## Phase 5: 3D Frontend - Assets & Models
- [x] Create placeholder geometries for all units
- [x] Create placeholder geometries for all buildings
- [x] Create terrain variations (grass, forest, mountain, water, gold mine)
- [x] Add tribe colors and territory visualization
- [x] Implement unit idle animations (floating/breathing)

## Phase 6: 3D Frontend - Game State
- [x] Create Zustand store (gameStore.ts)
- [x] Implement useGameState hook (polls gamestate.json)
- [x] Render units from game state
- [x] Render buildings from game state
- [x] Render territory ownership (colored borders)

## Phase 7: UI Components
- [x] Create TurnIndicator component
- [x] Create ResourcePanel component
- [x] Create PRSidebar component
- [x] Create main game layout (3D view + sidebar)

## Phase 8: Ghost Preview System
- [ ] Implement useGhostPreview hook
- [ ] Create GhostPreview component (semi-transparent units)
- [ ] Parse diff.json for preview data
- [ ] Show movement paths

## Phase 9: Glitch Effect
- [x] Create GlitchShader for failed PR state (enhanced in Building.tsx)
- [x] Apply to buildings when tribe has PR errors (via isGlitching prop)
- [x] HP bar display for buildings
- [x] Damage visualization (missing battlements, cracks)
- [ ] Clear effect when PR passes (integrated with PR polling)

## Phase 10: Animations
- [x] Unit spawn animation (pop effect)
- [x] Unit movement animation (smooth lerp with jump arc)
- [x] Unit death animation (scale down)
- [x] Building construction animation (rise from ground)
- [ ] Combat animation (clash + fade out)

## Phase 11: Lobby System
- [x] Create /lobby page
- [x] Implement prompt input for each tribe
- [x] Real-time display of all contributions
- [x] 30-minute countdown timer
- [ ] Gemini API integration for prompt aggregation
- [ ] Store aggregated prompts

## Phase 12: Game History
- [x] Create /history page
- [x] Create /history/[game_id] page
- [ ] Implement game archival system
- [x] Display past game results

## Phase 13: GitHub Integration
- [x] Create .github/workflows/validate-move.yml
- [x] Create .github/workflows/apply-move.yml
- [x] Implement PR status polling (usePRStatus hook)
- [ ] Connect frontend to raw GitHub gamestate.json

## Phase 14: Jules Integration
- [x] Create Jules API client (jules_client.py)
- [x] Create Jules orchestrator (orchestrator.py)
- [x] Add /api/jules endpoint for frontend
- [x] Create JulesControl UI component
- [x] Create system prompt templates for tribes
- [x] Implement turn rotation logic
- [x] Auto-merge GitHub Action for tribe PRs
- [x] Config-based repository settings (config.json)
- [ ] Add webhook for PR merge notifications
- [ ] Error handling and retry mechanism

## Phase 15: Polish
- [ ] Add sound effects (optional)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Color-blind accessibility

---

## Current Status

**Currently Working On:** Phase 14 - Jules Integration (when API is ready)

**Last Updated:** Completed Phases 1-7, 11-13 (core implementation + lobby + history + GitHub integration)

## Completed Files

### Frontend (Next.js + React Three Fiber)
- `src/app/page.tsx` - Main game page with 3D view and navigation
- `src/app/lobby/page.tsx` - Pre-game lobby with prompt inputs
- `src/app/history/page.tsx` - Game history list
- `src/app/history/[gameId]/page.tsx` - Individual game details
- `src/app/about/page.tsx` - About page with game mechanics
- `src/app/api/gamestate/route.ts` - API endpoint for game state
- `src/components/3d/GameScene.tsx` - Main 3D scene
- `src/components/3d/HexGrid.tsx` - Hex grid renderer
- `src/components/3d/HexTile.tsx` - Individual hex tile with terrain
- `src/components/3d/Unit.tsx` - Unit models with animations
- `src/components/3d/Building.tsx` - Building models
- `src/components/ui/Navigation.tsx` - Site-wide navigation
- `src/components/ui/TurnIndicator.tsx` - Turn status display
- `src/components/ui/ResourcePanel.tsx` - Resource display
- `src/components/ui/PRSidebar.tsx` - PR activity feed
- `src/hooks/useGameState.ts` - Game state polling hook
- `src/hooks/usePRStatus.ts` - GitHub PR status polling hook
- `src/store/gameStore.ts` - Zustand state management
- `src/lib/hexUtils.ts` - Hex coordinate utilities
- `src/lib/types.ts` - TypeScript type definitions

### Python Game Engine
- `engine/__init__.py` - Package init
- `engine/schemas.py` - Data schemas and types
- `engine/rules.py` - Game rules (combat, movement, etc.)
- `engine/validate.py` - Move validation
- `engine/state.py` - Game state management
- `engine/main.py` - CLI entry point

### Tribe Strategies
- `tribes/red/strategy.py` - Red tribe AI
- `tribes/blue/strategy.py` - Blue tribe AI
- `tribes/green/strategy.py` - Green tribe AI
- `tribes/yellow/strategy.py` - Yellow tribe AI

### Data
- `data/gamestate.json` - Initial game state

### Jules Integration
- `engine/jules_client.py` - Jules API client
- `engine/orchestrator.py` - Turn orchestration
- `src/app/api/jules/route.ts` - Jules API endpoint
- `src/components/ui/JulesControl.tsx` - Control panel UI

### GitHub Workflows
- `.github/workflows/validate-move.yml` - PR validation workflow
- `.github/workflows/apply-move.yml` - Move application workflow

### Documentation
- `README.md` - Project documentation
- `PRD.md` - Product requirements document
- `plan.md` - Implementation plan
