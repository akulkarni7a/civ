# Git-vilization: Product Requirements Document

## 1. Executive Summary

**Git-vilization** is a web-based, turn-based strategy game designed as a viral marketing showcase for **Jules**, Google's async AI coding agent. The game features four AI-controlled tribes competing for territory on a hex grid map. The twist: each tribe is powered by a separate Jules instance that must write actual Python code and submit GitHub Pull Requests to take turns.

Spectators watch the battle unfold in real-time through a visually stunning 3D isometric interface, and can influence the game by collectively crafting each tribe's strategic personality before the match begins.

---

## 2. Product Vision

### 2.1 Core Concept
"Civilization meets GitHub meets AI" — A spectator sport where AI agents play a strategy game by writing code.

### 2.2 Target Audience
- **Primary**: Developers and tech enthusiasts curious about AI coding agents
- **Secondary**: Strategy game fans, AI/ML community, tech Twitter/X

### 2.3 Success Metrics
- Viral social sharing (Twitter embeds, Reddit posts)
- GitHub repo stars and forks
- Time spent watching games
- Community prompt participation rate

---

## 3. User Experience

### 3.1 The Spectator Journey

```
┌─────────────────────────────────────────────────────────────────┐
│  LOBBY PHASE (30 min)                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ RED TRIBE│ │BLUE TRIBE│ │GREEN TRIBE│ │YELLOW    │           │
│  │          │ │          │ │          │ │TRIBE     │           │
│  │ [Prompt] │ │ [Prompt] │ │ [Prompt] │ │ [Prompt] │           │
│  │ Input    │ │ Input    │ │ Input    │ │ Input    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  Community writes strategy hints visible to all                 │
│  Timer: 28:45 remaining                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GAME PHASE                                                     │
│  ┌─────────────────────────────────────────┐ ┌───────────────┐ │
│  │                                         │ │ TURN: Red     │ │
│  │         3D ISOMETRIC HEX MAP            │ │ PR #42 Open   │ │
│  │    (React Three Fiber Renderer)         │ │               │ │
│  │                                         │ │ "Implement    │ │
│  │   🏰←Red    🌲🌲    ⛏️     🏰←Blue     │ │  knight move  │ │
│  │      🗡️    🌲🌲   🌲🌲       🗡️        │ │  to (4,5)"    │ │
│  │           🌲🌲    ⛏️                    │ │               │ │
│  │   🏰←Green        🌲🌲    🏰←Yellow    │ │ [View PR →]   │ │
│  │      🗡️          🌲🌲       🗡️         │ │               │ │
│  │                                         │ ├───────────────┤ │
│  └─────────────────────────────────────────┘ │ RESOURCES     │ │
│                                              │ 🔴 Gold: 150  │ │
│                                              │ 🔵 Gold: 120  │ │
│                                              │ 🟢 Gold: 180  │ │
│                                              │ 🟡 Gold: 140  │ │
│                                              └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Loop

1. **"Red Tribe is thinking..."** — Jules is processing the game state
2. **"Red Tribe opened PR #42"** — PR appears in sidebar with description
3. **Ghost Preview** — Semi-transparent preview of the proposed move renders on map
4. **Validation** — GitHub Action validates the move
5. **Merge & Animate** — PR merges, units animate to new positions
6. **Next Tribe** — Blue Tribe's turn begins automatically

### 3.3 Visual Style

- **Aesthetic**: "Cozy Strategy" — Think Dorfromantik, Polytopia, Townscaper
- **Rendering**: Low-poly 3D isometric view
- **Palette**: Soft pastels
  - Grass: `#A2D149`
  - Water: `#4DA6FF`
  - Mountains: `#8B7355`
  - Territory borders: Tribe colors with transparency
- **Animations**: Smooth, satisfying
  - Units "pop" when spawned
  - Subtle floating/breathing idle animation
  - Combat shows clash effect + loser fades out

### 3.4 The "Glitch" State

When Jules writes code with syntax errors:
- The tribe's castle visually glitches (shader distortion, static effect)
- PR shows red "Build Failed" status
- CI comments on PR with error details
- Jules reads comments and submits fix
- Glitch clears when PR passes validation

---

## 4. Game Mechanics

### 4.1 Map

| Property | Value |
|----------|-------|
| Grid Type | Hexagonal |
| Size | 20×20 hexes |
| Generation | Procedural per game |
| Terrain Types | Grass, Forest, Mountain, Water, Gold Mine |
| Visibility | Full map visible (no fog of war) |

**Starting Positions**: Four corners
```
    🔴 · · · · · · · · · · · · · · · · · 🔵
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    · · · · · · · · · · · · · · · · · · ·
    🟢 · · · · · · · · · · · · · · · · · 🟡
```

### 4.2 Territory System

- **Ownership**: Each hex can belong to one tribe or be neutral
- **Initial Territory**: 7 hexes around starting castle (center + 6 adjacent)
- **Expansion**: Settlers can claim adjacent neutral hexes
- **Visual**: Colored border/tint shows ownership
- **Rules**:
  - Can only build within owned territory
  - Can only harvest gold mines within owned territory
  - Units can move through any passable terrain

### 4.3 Resources

| Resource | Source | Usage |
|----------|--------|-------|
| Gold | Gold mines (worker harvests) | Units, Buildings |

- Workers stationed on a gold mine within territory produce gold each turn
- Starting gold: **100**

### 4.4 Units

| Unit | Cost | Combat Strength | Movement | Special |
|------|------|-----------------|----------|---------|
| Worker | 25 | 0 | 2 | Harvests gold mines (10 gold/turn) |
| Settler | 50 | 0 | 2 | Expands territory to adjacent hex |
| Warrior | 30 | 3 | 2 | Basic melee fighter |
| Archer | 40 | 2 | 2 | Ranged attack (2 hex range) |
| Knight | 75 | 6 | 3 | Strongest unit, fast movement |

### 4.5 Buildings

| Building | Cost | Effect |
|----------|------|--------|
| Castle | — | Starting building. Spawn point. Defines territory. If destroyed, tribe eliminated. |
| Barracks | 100 | Required to train Warriors, Archers, Knights |
| Tower | 75 | Defensive structure. +2 combat strength to adjacent friendly units |
| Wall | 25 | Blocks movement. Must be destroyed to pass. HP: 5 |

### 4.6 Combat Resolution

Combat uses **unit strength + d6 roll**:

```
Attacker Score = Attacker Strength + random(1-6)
Defender Score = Defender Strength + random(1-6) + terrain bonus

If Attacker Score > Defender Score: Defender dies
If Defender Score >= Attacker Score: Attacker dies
```

**Terrain Bonuses**:
- Forest: +1 defense
- Mountain: +2 defense (if unit can occupy)
- Tower adjacent: +2 defense

**Ranged Combat** (Archers):
- Can attack units 2 hexes away
- No retaliation from melee units
- Reduced strength at range: -1

### 4.7 Turn Structure

Each tribe gets **ONE action** per turn. Actions:

| Action | Description |
|--------|-------------|
| `MOVE` | Move one unit up to its movement range |
| `ATTACK` | Attack an adjacent enemy unit (or ranged for Archer) |
| `BUILD` | Construct a building on owned territory |
| `TRAIN` | Train a unit at Castle or Barracks |
| `HARVEST` | Assign worker to gold mine |
| `SETTLE` | Use settler to claim adjacent neutral hex |

### 4.8 Win Condition

**Eliminate all enemy Castles.** When a Castle is destroyed, that tribe is eliminated and all their units are removed.

### 4.9 Turn Order

Fixed rotation: **Red → Blue → Green → Yellow → Red → ...**

Turn advances automatically when:
1. Current tribe's PR is merged to `main`
2. `gamestate.json` is updated
3. Frontend detects new state
4. Next tribe's Jules instance is triggered

---

## 5. Community Prompt System

### 5.1 Lobby Phase

Before each game, spectators have **30 minutes** to craft system prompts for each tribe.

### 5.2 Prompt Contribution Flow

1. User selects a tribe to influence
2. User writes strategic/personality hints in a shared text area
3. All contributions are visible in real-time (collaborative)
4. Examples:
   - "Be aggressive, rush enemies early"
   - "Focus on economy first, build workers"
   - "Form temporary alliances, betray later"
   - "Speak like a pirate in PR descriptions"

### 5.3 Prompt Aggregation

When lobby ends:
1. All text contributions per tribe are collected
2. **Gemini API** synthesizes a coherent system prompt
3. Prompt is prepended to Jules' instructions for that tribe
4. Aggregated prompts are displayed publicly

### 5.4 What Prompts Influence

- **Personality**: PR titles/descriptions, "thinking" messages
- **Strategy**: Prioritization of actions (aggressive vs. defensive, economy vs. military)
- **Flavor**: How the tribe "talks" and presents itself

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   SPECTATOR      │     │   GITHUB REPO    │     │   JULES (×4)     │
│   (Browser)      │     │   (Database)     │     │   (AI Agents)    │
│                  │     │                  │     │                  │
│  Next.js + R3F   │◄────│  gamestate.json  │◄────│  strategy.py     │
│                  │     │  PRs             │     │  PRs             │
│  Polls state     │     │  Actions CI/CD   │     │  Reads state     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### 6.2 Data Flow

```
1. Jules (Red) reads gamestate.json
2. Jules writes/updates tribes/red/strategy.py
3. Jules opens PR: feat/red-turn-42
4. GitHub Action triggers:
   - Runs python engine/validate_move.py
   - Imports strategy.py, passes gamestate
   - Validates returned action
   - Generates diff.json (preview)
5. Frontend shows ghost preview from diff.json
6. PR merged to main
7. GitHub Action commits updated gamestate.json
8. Webhook triggers next Jules instance (Blue)
9. Frontend polls, sees new state, animates changes
```

### 6.3 The Player Interface (strategy.py)

Each Jules instance edits ONE file: `/tribes/[color]/strategy.py`

```python
"""
Strategy file for [COLOR] Tribe.
Jules edits this file to make moves.
"""

def get_action(gamestate: dict) -> dict:
    """
    Analyze the game state and return ONE action.

    Args:
        gamestate: The full game state dictionary

    Returns:
        An action dictionary, e.g.:
        {"action": "MOVE", "unit_id": 12, "target": [4, 5]}
        {"action": "ATTACK", "unit_id": 12, "target_id": 8}
        {"action": "BUILD", "building": "BARRACKS", "position": [3, 3]}
        {"action": "TRAIN", "unit_type": "WARRIOR", "building_id": 1}
        {"action": "HARVEST", "unit_id": 5, "mine_id": 2}
        {"action": "SETTLE", "unit_id": 7, "target": [5, 6]}
    """

    # Jules writes strategy logic here
    my_tribe = gamestate["current_tribe"]
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]

    # Example: Move first knight toward center
    knights = [u for u in my_units if u["type"] == "KNIGHT"]
    if knights:
        return {
            "action": "MOVE",
            "unit_id": knights[0]["id"],
            "target": [10, 10]
        }

    return {"action": "TRAIN", "unit_type": "WORKER", "building_id": 1}
```

### 6.4 Game State Schema (gamestate.json)

```json
{
  "game_id": "game_2024_001",
  "turn": 42,
  "current_tribe": "RED",
  "status": "IN_PROGRESS",

  "map": {
    "width": 20,
    "height": 20,
    "tiles": [
      {"q": 0, "r": 0, "terrain": "GRASS", "owner": "RED"},
      {"q": 1, "r": 0, "terrain": "FOREST", "owner": null},
      {"q": 2, "r": 0, "terrain": "GOLD_MINE", "owner": null}
    ]
  },

  "tribes": {
    "RED": {"gold": 150, "alive": true},
    "BLUE": {"gold": 120, "alive": true},
    "GREEN": {"gold": 180, "alive": true},
    "YELLOW": {"gold": 140, "alive": true}
  },

  "units": [
    {
      "id": 1,
      "tribe": "RED",
      "type": "KNIGHT",
      "position": [2, 3],
      "can_act": true
    },
    {
      "id": 2,
      "tribe": "RED",
      "type": "WORKER",
      "position": [1, 1],
      "harvesting": 5
    }
  ],

  "buildings": [
    {
      "id": 1,
      "tribe": "RED",
      "type": "CASTLE",
      "position": [0, 0],
      "hp": 10
    }
  ],

  "gold_mines": [
    {"id": 5, "position": [3, 4], "worker_id": null}
  ],

  "history": [
    {"turn": 41, "tribe": "YELLOW", "action": "MOVE", "details": {...}}
  ]
}
```

### 6.5 Directory Structure

```
/
├── .github/
│   └── workflows/
│       ├── validate-move.yml    # Runs on PR
│       └── apply-move.yml       # Runs on merge to main
│
├── engine/                      # Python Game Logic
│   ├── __init__.py
│   ├── main.py                  # Entry point for CI/CD
│   ├── validate.py              # Move validation
│   ├── rules.py                 # Combat, resources, territory
│   ├── state.py                 # Game state management
│   └── schemas.py               # JSON schemas, types
│
├── tribes/                      # Where Jules instances play
│   ├── red/
│   │   └── strategy.py
│   ├── blue/
│   │   └── strategy.py
│   ├── green/
│   │   └── strategy.py
│   └── yellow/
│       └── strategy.py
│
├── src/                         # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx             # Main game view
│   │   ├── lobby/page.tsx       # Pre-game prompt crafting
│   │   └── history/page.tsx     # Past games
│   │
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── HexGrid.tsx
│   │   │   ├── HexTile.tsx
│   │   │   ├── Unit.tsx
│   │   │   ├── Building.tsx
│   │   │   └── GhostPreview.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── TurnIndicator.tsx
│   │   │   ├── ResourcePanel.tsx
│   │   │   ├── PRSidebar.tsx
│   │   │   └── PromptEditor.tsx
│   │   │
│   │   └── effects/
│   │       └── GlitchShader.tsx
│   │
│   ├── hooks/
│   │   ├── useGameState.ts      # Polls GitHub for state
│   │   ├── useGhostPreview.ts   # Shows pending moves
│   │   └── usePRStatus.ts       # Tracks open PRs
│   │
│   └── store/
│       └── gameStore.ts         # Zustand store
│
├── data/
│   ├── gamestate.json           # Current game (source of truth)
│   └── history/
│       └── game_2024_001.json   # Archived games
│
├── public/
│   └── models/                  # GLTF assets
│       ├── castle.glb
│       ├── knight.glb
│       └── ...
│
└── package.json
```

---

## 7. Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Main game view (3D map, current game) |
| `/lobby` | Pre-game prompt crafting (30 min timer) |
| `/history` | List of past games with results |
| `/history/[game_id]` | View final state of a past game |
| `/about` | Explanation of Jules, how it works |

---

## 8. Game History & Archives

### 8.1 What Gets Saved

For each completed game:
- `game_id`: Unique identifier
- `winner`: Winning tribe color
- `final_state`: Complete `gamestate.json` at game end
- `turn_count`: Total turns played
- `duration`: Real-world time elapsed
- `pr_links`: Array of all PR URLs from the game
- `community_prompts`: The aggregated prompts used

### 8.2 Storage

- Completed games saved to `/data/history/[game_id].json`
- List of all games in `/data/history/index.json`

---

## 9. Jules Integration

### 9.1 Trigger Flow

```
PR Merged (Red's turn)
        │
        ▼
GitHub Action updates gamestate.json
        │
        ▼
Webhook calls Jules API for Blue tribe
        │
        ▼
Jules receives:
  - System prompt (from community)
  - Game rules documentation
  - Current gamestate.json
  - Instructions to edit strategy.py
        │
        ▼
Jules opens PR with updated strategy.py
        │
        ▼
Cycle continues...
```

### 9.2 Jules System Prompt Template

```
You are playing Git-vilization as the {COLOR} tribe.

## Community Instructions
{AGGREGATED_COMMUNITY_PROMPT}

## Your Objective
Eliminate all enemy tribes by destroying their Castles.

## How to Play
1. Read the current game state from data/gamestate.json
2. Edit your strategy file at tribes/{color}/strategy.py
3. Implement the get_action() function to return ONE valid action
4. Create a PR with a descriptive title explaining your move

## Valid Actions
- MOVE: Move a unit {"action": "MOVE", "unit_id": X, "target": [q, r]}
- ATTACK: Attack enemy {"action": "ATTACK", "unit_id": X, "target_id": Y}
- BUILD: Construct building {"action": "BUILD", "building": "TYPE", "position": [q, r]}
- TRAIN: Train unit {"action": "TRAIN", "unit_type": "TYPE", "building_id": X}
- HARVEST: Assign worker {"action": "HARVEST", "unit_id": X, "mine_id": Y}
- SETTLE: Expand territory {"action": "SETTLE", "unit_id": X, "target": [q, r]}

## Current State Summary
Turn: {TURN}
Your Gold: {GOLD}
Your Units: {UNIT_SUMMARY}
Enemy Positions: {ENEMY_SUMMARY}

Think strategically. Consider economy, expansion, and military balance.
```

### 9.3 Error Handling

When Jules submits invalid code:

1. **GitHub Action** runs validation
2. **If syntax error**: CI fails, comments on PR with Python traceback
3. **If invalid move**: CI fails, comments on PR with rule violation
4. **Jules** sees the comment (Jules monitors PR comments)
5. **Jules** pushes a fix commit
6. **CI re-runs** validation
7. Repeat until valid or max retries (5)

If max retries exceeded:
- Turn is forfeited
- `gamestate.json` updated with `"action": "FORFEIT"`
- Next tribe's turn begins

---

## 10. Frontend Technical Requirements

### 10.1 3D Rendering Stack

| Library | Purpose |
|---------|---------|
| `three` | Core 3D engine |
| `@react-three/fiber` | React bindings for Three.js |
| `@react-three/drei` | Helpers (OrbitControls, useGLTF, Environment) |
| `leva` | Debug controls for development |
| `zustand` | State management |

### 10.2 Key Components

**HexGrid.tsx**
- Renders 20×20 hex grid
- Colors tiles by terrain type
- Overlays ownership tint

**Unit.tsx**
- Loads GLTF model based on unit type
- Subtle idle animation (floating/breathing)
- Smooth movement animation when position changes

**GhostPreview.tsx**
- Semi-transparent render of proposed move
- Appears when PR is open but not merged
- Shows path for MOVE actions
- Shows target indicator for ATTACK

**GlitchShader.tsx**
- Shader effect for tribes with failed PRs
- Static/distortion on Castle model
- Clears when PR passes

### 10.3 State Management

```typescript
// gameStore.ts
interface GameStore {
  // Current game state (from GitHub)
  gameState: GameState | null;

  // Ghost preview (from open PR)
  ghostPreview: GhostPreview | null;

  // PR status
  currentPR: PRStatus | null;

  // Actions
  fetchGameState: () => Promise<void>;
  fetchPRStatus: () => Promise<void>;
}
```

### 10.4 Polling Strategy

- Poll `gamestate.json` every **5 seconds**
- Poll GitHub PR API every **10 seconds**
- Use ETag/If-None-Match for efficiency
- WebSocket upgrade path for future (optional)

---

## 11. Asset Requirements

### 11.1 3D Models (GLTF)

| Asset | Description |
|-------|-------------|
| `hex_grass.glb` | Grass hex tile |
| `hex_forest.glb` | Forest hex with trees |
| `hex_mountain.glb` | Mountain hex |
| `hex_water.glb` | Water hex |
| `hex_gold.glb` | Gold mine hex |
| `castle.glb` | Castle building |
| `barracks.glb` | Barracks building |
| `tower.glb` | Tower building |
| `wall.glb` | Wall segment |
| `worker.glb` | Worker unit |
| `settler.glb` | Settler unit |
| `warrior.glb` | Warrior unit |
| `archer.glb` | Archer unit |
| `knight.glb` | Knight unit (mounted) |

### 11.2 Style Reference

- **Kenney.nl** low-poly packs
- Soft pastels, not harsh shadows
- Stylized, not realistic

### 11.3 Audio (Optional)

| Sound | Trigger |
|-------|---------|
| `pop.wav` | Building/unit spawned |
| `move.wav` | Unit movement |
| `clash.wav` | Combat |
| `victory.wav` | Tribe eliminated |
| `ambient.wav` | Background loop |

---

## 12. Non-Functional Requirements

### 12.1 Performance

- 60 FPS on modern browsers
- Initial load < 5 seconds
- Game state fetch < 500ms

### 12.2 Browser Support

- Chrome, Firefox, Safari, Edge (latest 2 versions)
- WebGL 2.0 required

### 12.3 Mobile

- Responsive layout
- Touch controls for camera
- Reduced model complexity for mobile

### 12.4 Accessibility

- Alt text for key game events
- Screen reader announcements for turns
- Color-blind friendly tribe indicators (patterns + colors)

---

## 13. Future Enhancements (Out of Scope for MVP)

- [ ] Live chat for spectators
- [ ] Betting system (prediction market)
- [ ] Custom maps
- [ ] Tournament brackets
- [ ] Human vs. Jules mode
- [ ] Multiple simultaneous games
- [ ] WebSocket real-time updates

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Jules** | Google's async AI coding agent |
| **Tribe** | One of four AI players (Red, Blue, Green, Yellow) |
| **Ghost Preview** | Semi-transparent visualization of pending move |
| **Glitch State** | Visual corruption when PR has errors |
| **Territory** | Hexes owned by a tribe |
| **PR** | GitHub Pull Request |

---

## 15. Appendix: Action Schema Reference

### MOVE
```json
{
  "action": "MOVE",
  "unit_id": 12,
  "target": [4, 5]
}
```

### ATTACK
```json
{
  "action": "ATTACK",
  "unit_id": 12,
  "target_id": 8
}
```

### BUILD
```json
{
  "action": "BUILD",
  "building": "BARRACKS",
  "position": [3, 3]
}
```

### TRAIN
```json
{
  "action": "TRAIN",
  "unit_type": "WARRIOR",
  "building_id": 1
}
```

### HARVEST
```json
{
  "action": "HARVEST",
  "unit_id": 5,
  "mine_id": 2
}
```

### SETTLE
```json
{
  "action": "SETTLE",
  "unit_id": 7,
  "target": [5, 6]
}
```

---

*Document Version: 1.0*
*Last Updated: 2024*
