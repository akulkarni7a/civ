"""
Game state management and action application.
"""

import json
import random
from pathlib import Path
from typing import Optional
from schemas import (
    GameState,
    GameMap,
    GameAction,
    Action,
    ActionType,
    TribeColor,
    TerrainType,
    UnitType,
    BuildingType,
    Unit,
    Building,
    Tile,
    TribeState,
    GoldMine,
    GameStatus,
    UNIT_STATS,
    BUILDING_STATS,
    STARTING_GOLD,
)
from rules import GameRules
from validate import MoveValidator


class GameStateManager:
    """Manages game state loading, saving, and modification."""

    def __init__(self, state: Optional[GameState] = None):
        self.state = state
        self._next_unit_id = 100
        self._next_building_id = 100

    @classmethod
    def load(cls, path: str) -> "GameStateManager":
        """Load game state from a JSON file."""
        with open(path, "r") as f:
            data = json.load(f)
        state = GameState.from_dict(data)
        manager = cls(state)

        # Initialize ID counters
        if state.units:
            manager._next_unit_id = max(u.id for u in state.units) + 1
        if state.buildings:
            manager._next_building_id = max(b.id for b in state.buildings) + 1

        return manager

    def save(self, path: str) -> None:
        """Save game state to a JSON file."""
        with open(path, "w") as f:
            f.write(self.state.to_json())

    @classmethod
    def create_new_game(cls, game_id: str, width: int = 20, height: int = 20) -> "GameStateManager":
        """Create a new game with default setup."""
        manager = cls()

        # Generate map
        tiles = manager._generate_map(width, height)

        # Gold mine positions (symmetric)
        gold_mine_positions = [
            (5, 5), (14, 5), (5, 14), (14, 14),  # Corners-ish
            (9, 9), (10, 10),  # Center
            (9, 4), (10, 15),  # Additional
        ]

        # Update terrain for gold mines
        for q, r in gold_mine_positions:
            for tile in tiles:
                if tile.q == q and tile.r == r:
                    tile.terrain = TerrainType.GOLD_MINE
                    break

        # Starting positions for tribes (corners)
        starting_positions = {
            TribeColor.RED: (0, 0),
            TribeColor.BLUE: (width - 1, 0),
            TribeColor.GREEN: (0, height - 1),
            TribeColor.YELLOW: (width - 1, height - 1),
        }

        # Set initial territory (7 hexes around castle)
        for tribe, (sq, sr) in starting_positions.items():
            for tile in tiles:
                dist = GameRules.hex_distance((tile.q, tile.r), (sq, sr))
                if dist <= 2:
                    tile.owner = tribe
                    # Clear forests/mountains from starting areas
                    if tile.terrain in [TerrainType.FOREST, TerrainType.MOUNTAIN]:
                        tile.terrain = TerrainType.GRASS

        game_map = GameMap(width=width, height=height, tiles=tiles)

        # Create tribes
        tribes = {
            tribe: TribeState(gold=STARTING_GOLD, alive=True)
            for tribe in TribeColor
        }

        # Create starting buildings (castles)
        buildings = []
        for i, (tribe, pos) in enumerate(starting_positions.items(), start=1):
            buildings.append(Building(
                id=i,
                tribe=tribe,
                type=BuildingType.CASTLE,
                position=pos,
                hp=BUILDING_STATS[BuildingType.CASTLE]["hp"],
            ))

        # Create starting units (one knight per tribe)
        units = []
        for i, (tribe, (sq, sr)) in enumerate(starting_positions.items(), start=1):
            # Place knight adjacent to castle
            knight_pos = (sq + 1, sr) if sq == 0 else (sq - 1, sr)
            units.append(Unit(
                id=i,
                tribe=tribe,
                type=UnitType.KNIGHT,
                position=knight_pos,
                can_act=tribe == TribeColor.RED,  # Only first tribe can act
            ))

        # Create gold mines
        gold_mines = [
            GoldMine(id=i + 1, position=pos, worker_id=None)
            for i, pos in enumerate(gold_mine_positions)
        ]

        state = GameState(
            game_id=game_id,
            turn=1,
            current_tribe=TribeColor.RED,
            status=GameStatus.IN_PROGRESS,
            map=game_map,
            tribes=tribes,
            units=units,
            buildings=buildings,
            gold_mines=gold_mines,
            history=[],
        )

        manager.state = state
        manager._next_unit_id = len(units) + 1
        manager._next_building_id = len(buildings) + 1

        return manager

    def _generate_map(self, width: int, height: int) -> list[Tile]:
        """Generate a procedural map."""
        tiles = []

        for r in range(height):
            for q in range(width):
                # Default to grass
                terrain = TerrainType.GRASS

                # Add some randomness
                rand = random.random()
                if rand < 0.12:
                    terrain = TerrainType.FOREST
                elif rand < 0.15:
                    terrain = TerrainType.MOUNTAIN

                tiles.append(Tile(q=q, r=r, terrain=terrain, owner=None))

        return tiles

    def apply_action(self, tribe: TribeColor, action: Action) -> tuple[bool, str, dict]:
        """
        Apply an action to the game state.
        Returns (success, message, diff).
        """
        # Validate first
        valid, error = MoveValidator.validate(self.state, tribe, action)
        if not valid:
            return False, error, {}

        diff = {"action": action.to_dict(), "changes": []}

        # Apply based on action type
        if action.action == ActionType.MOVE:
            self._apply_move(action, diff)
        elif action.action == ActionType.ATTACK:
            self._apply_attack(action, diff)
        elif action.action == ActionType.BUILD:
            self._apply_build(tribe, action, diff)
        elif action.action == ActionType.TRAIN:
            self._apply_train(tribe, action, diff)
        elif action.action == ActionType.HARVEST:
            self._apply_harvest(action, diff)
        elif action.action == ActionType.SETTLE:
            self._apply_settle(action, diff)

        # Record action in history
        self.state.history.append(GameAction(
            turn=self.state.turn,
            tribe=tribe,
            action=action.action,
            details=action.to_dict(),
        ))

        # Advance turn
        self._advance_turn(diff)

        return True, "Action applied successfully", diff

    def _apply_move(self, action: Action, diff: dict) -> None:
        """Apply a MOVE action."""
        unit = self.state.get_unit(action.unit_id)
        old_pos = unit.position
        unit.position = action.target

        # If worker was harvesting, stop
        if unit.harvesting is not None:
            mine = self.state.get_mine(unit.harvesting)
            if mine:
                mine.worker_id = None
            unit.harvesting = None

        diff["changes"].append({
            "type": "unit_moved",
            "unit_id": unit.id,
            "from": list(old_pos),
            "to": list(action.target),
        })

    def _apply_attack(self, action: Action, diff: dict) -> None:
        """Apply an ATTACK action."""
        attacker = self.state.get_unit(action.unit_id)
        defender = self.state.get_unit(action.target_id)

        # Check if ranged
        distance = GameRules.hex_distance(attacker.position, defender.position)
        is_ranged = distance > 1

        # Resolve combat
        attacker_wins, atk_roll, def_roll = GameRules.resolve_combat(
            attacker, defender, self.state, is_ranged
        )

        if attacker_wins:
            # Remove defender
            self.state.units = [u for u in self.state.units if u.id != defender.id]

            # If not ranged, move attacker to defender's position
            if not is_ranged:
                old_pos = attacker.position
                attacker.position = defender.position
                diff["changes"].append({
                    "type": "unit_moved",
                    "unit_id": attacker.id,
                    "from": list(old_pos),
                    "to": list(defender.position),
                })

            diff["changes"].append({
                "type": "unit_killed",
                "unit_id": defender.id,
                "killer_id": attacker.id,
            })
        else:
            # Remove attacker
            self.state.units = [u for u in self.state.units if u.id != attacker.id]
            diff["changes"].append({
                "type": "unit_killed",
                "unit_id": attacker.id,
                "killer_id": defender.id,
            })

        diff["changes"].append({
            "type": "combat",
            "attacker_id": attacker.id,
            "defender_id": defender.id,
            "attacker_roll": atk_roll,
            "defender_roll": def_roll,
            "attacker_wins": attacker_wins,
        })

    def _apply_build(self, tribe: TribeColor, action: Action, diff: dict) -> None:
        """Apply a BUILD action."""
        cost = BUILDING_STATS[action.building]["cost"]
        self.state.tribes[tribe].gold -= cost

        building = Building(
            id=self._next_building_id,
            tribe=tribe,
            type=action.building,
            position=action.position,
            hp=BUILDING_STATS[action.building]["hp"],
        )
        self._next_building_id += 1
        self.state.buildings.append(building)

        diff["changes"].append({
            "type": "building_created",
            "building_id": building.id,
            "building_type": action.building.value,
            "position": list(action.position),
            "tribe": tribe.value,
        })

    def _apply_train(self, tribe: TribeColor, action: Action, diff: dict) -> None:
        """Apply a TRAIN action."""
        cost = UNIT_STATS[action.unit_type]["cost"]
        self.state.tribes[tribe].gold -= cost

        building = self.state.get_building(action.building_id)

        unit = Unit(
            id=self._next_unit_id,
            tribe=tribe,
            type=action.unit_type,
            position=building.position,
            can_act=False,  # Can't act until next turn
        )
        self._next_unit_id += 1
        self.state.units.append(unit)

        diff["changes"].append({
            "type": "unit_trained",
            "unit_id": unit.id,
            "unit_type": action.unit_type.value,
            "position": list(building.position),
            "tribe": tribe.value,
        })

    def _apply_harvest(self, action: Action, diff: dict) -> None:
        """Apply a HARVEST action."""
        unit = self.state.get_unit(action.unit_id)
        mine = self.state.get_mine(action.mine_id)

        unit.harvesting = mine.id
        mine.worker_id = unit.id

        diff["changes"].append({
            "type": "harvest_started",
            "unit_id": unit.id,
            "mine_id": mine.id,
        })

    def _apply_settle(self, action: Action, diff: dict) -> None:
        """Apply a SETTLE action."""
        unit = self.state.get_unit(action.unit_id)

        # Expand territory
        self.state.map.set_tile_owner(action.target[0], action.target[1], unit.tribe)

        # Remove settler (consumed)
        self.state.units = [u for u in self.state.units if u.id != unit.id]

        diff["changes"].append({
            "type": "territory_expanded",
            "position": list(action.target),
            "tribe": unit.tribe.value,
        })
        diff["changes"].append({
            "type": "unit_consumed",
            "unit_id": unit.id,
        })

    def _advance_turn(self, diff: dict) -> None:
        """Advance to the next tribe's turn."""
        # Collect income
        income = GameRules.collect_income(self.state)
        for tribe, amount in income.items():
            if amount > 0:
                self.state.tribes[tribe].gold += amount
                diff["changes"].append({
                    "type": "income_collected",
                    "tribe": tribe.value,
                    "amount": amount,
                })

        # Check for castle destruction (elimination)
        for tribe in TribeColor:
            if not self.state.tribes[tribe].alive:
                continue

            has_castle = any(
                b.type == BuildingType.CASTLE and b.tribe == tribe
                for b in self.state.buildings
            )
            if not has_castle:
                self.state.tribes[tribe].alive = False
                # Remove all units of eliminated tribe
                self.state.units = [u for u in self.state.units if u.tribe != tribe]
                diff["changes"].append({
                    "type": "tribe_eliminated",
                    "tribe": tribe.value,
                })

        # Check victory
        winner = GameRules.check_victory(self.state)
        if winner:
            self.state.status = GameStatus.FINISHED
            diff["changes"].append({
                "type": "game_over",
                "winner": winner.value,
            })
            return

        # Get next tribe
        next_tribe = GameRules.get_next_tribe(self.state.current_tribe, self.state)

        # If we've gone around, increment turn and reset can_act
        current_order = [TribeColor.RED, TribeColor.BLUE, TribeColor.GREEN, TribeColor.YELLOW]
        current_idx = current_order.index(self.state.current_tribe)
        next_idx = current_order.index(next_tribe)

        if next_idx <= current_idx:
            self.state.turn += 1
            # Reset can_act for all units
            for unit in self.state.units:
                unit.can_act = True

        self.state.current_tribe = next_tribe

        diff["changes"].append({
            "type": "turn_advanced",
            "turn": self.state.turn,
            "current_tribe": next_tribe.value,
        })
