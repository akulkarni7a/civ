# Git-vilization

A turn-based strategy game where 4 AI tribes battle for territory on a hexagonal map. Each tribe is controlled by a separate instance of **Jules** (Google's AI coding agent), which writes Python code to make strategic moves via GitHub Pull Requests.

## Overview

Git-vilization is a viral marketing showcase for the Jules API. Instead of clicking buttons, AI agents submit GitHub Pull Requests containing their strategy code. When a PR is merged, the game state updates and the next tribe takes their turn.

### Key Features

- **4 AI Tribes**: RED, BLUE, GREEN, YELLOW - each controlled by a separate Jules instance
- **3D Hex Grid**: 20x20 hexagonal map with terrain types (grass, forest, mountain, water, gold mines)
- **GitHub-Native Gameplay**: All moves submitted via PRs, validated by CI/CD
- **Community Prompts**: Before each game, the community can influence tribe strategies
- **Real-time Spectating**: Watch the battle unfold in the browser

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React Three Fiber, Three.js |
| State Management | Zustand |
| Game Engine | Python 3.x |
| CI/CD | GitHub Actions |
| Styling | Tailwind CSS |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- GitHub account (for PR-based gameplay)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gitvilization.git
cd gitvilization

# Install frontend dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the game.

### Running the Game Engine

```bash
cd engine

# Create a new game
python main.py new

# Validate a move
python main.py validate tribes/red/strategy.py

# Apply a move (after validation)
python main.py run tribes/red/strategy.py
```

## Game Mechanics

### Units

| Unit | Cost | Strength | Movement | Special |
|------|------|----------|----------|---------|
| Worker | 25 | 0 | 2 | Harvests gold mines |
| Settler | 50 | 0 | 2 | Expands territory |
| Warrior | 30 | 3 | 2 | Basic fighter |
| Archer | 40 | 2 | 2 | 2-hex ranged attack |
| Knight | 75 | 6 | 3 | Strongest unit |

### Buildings

| Building | Cost | HP | Function |
|----------|------|-----|----------|
| Castle | - | 100 | HQ. Train units. If destroyed, tribe eliminated. |
| Barracks | 100 | 50 | Train combat units. |
| Tower | 75 | 40 | +2 defense to adjacent friendly units. |
| Wall | 25 | 30 | Blocks enemy movement. |

### Combat System

```
Attacker Score = Strength + d6
Defender Score = Strength + d6 + Terrain Bonus
```

**Terrain Bonuses**: Forest +1, Mountain +2, Adjacent Tower +2

### Victory Condition

**Eliminate all enemy Castles.** The last tribe standing wins!

## Project Structure

```
gitvilization/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Main game view
│   │   ├── lobby/             # Pre-game lobby
│   │   ├── history/           # Game history
│   │   └── about/             # About page
│   ├── components/
│   │   ├── 3d/                # React Three Fiber components
│   │   │   ├── GameScene.tsx  # Main 3D scene
│   │   │   ├── HexGrid.tsx    # Hex grid renderer
│   │   │   ├── HexTile.tsx    # Individual hex tiles
│   │   │   ├── Unit.tsx       # Unit models
│   │   │   └── Building.tsx   # Building models
│   │   └── ui/                # UI components
│   │       ├── Navigation.tsx
│   │       ├── TurnIndicator.tsx
│   │       ├── ResourcePanel.tsx
│   │       └── PRSidebar.tsx
│   ├── store/                  # Zustand state management
│   ├── lib/                    # Utilities and types
│   └── hooks/                  # Custom React hooks
├── engine/                     # Python game engine
│   ├── schemas.py             # Data models
│   ├── rules.py               # Game rules
│   ├── validate.py            # Move validation
│   ├── state.py               # State management
│   └── main.py                # CLI entry point
├── tribes/                     # AI tribe strategies
│   ├── red/strategy.py
│   ├── blue/strategy.py
│   ├── green/strategy.py
│   └── yellow/strategy.py
├── data/
│   └── gamestate.json         # Current game state
└── .github/
    └── workflows/
        ├── validate-move.yml  # PR validation
        └── apply-move.yml     # Apply moves on merge
```

## How Jules Plays

1. **Read State**: Jules reads `data/gamestate.json` to understand the current game
2. **Analyze**: Evaluates positions, resources, threats, and opportunities
3. **Decide**: Selects one action from available moves
4. **Code**: Writes Python code in `tribes/{color}/strategy.py`
5. **Submit**: Creates a Pull Request with the strategy
6. **Validate**: GitHub Actions validates the move
7. **Merge**: If valid, PR is merged and game state updates

### Strategy Template

```python
# tribes/red/strategy.py
from schemas import GameState, Action

def get_action(state: GameState) -> Action:
    """
    Analyze the game state and return a single action.

    Available action types:
    - MOVE: Move a unit to an adjacent hex
    - ATTACK: Attack an enemy unit or building
    - BUILD: Construct a building
    - TRAIN: Train a new unit at a building
    - HARVEST: Collect gold from a mine
    - SETTLE: Claim territory with a settler
    """
    # Your strategy here
    return Action(
        type="MOVE",
        unit_id="knight_0",
        target=(10, 10)
    )
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gamestate` | GET | Current game state |
| `/api/history` | GET | Past games |
| `/api/lobby` | GET/POST | Lobby status and prompts |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built as a showcase for the [Jules API](https://developers.google.com/jules/api)
- Inspired by classic 4X strategy games
- 3D graphics powered by [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
