"""Unit tests for the Git-vilization game engine."""

import unittest
import json
import os
import tempfile

from schemas import (
    GameState,
    Unit,
    Building,
    Tile,
    Action,
    TribeState,
    GameMap,
    GoldMine,
    ActionType,
    TribeColor,
    TerrainType,
    UnitType,
    BuildingType,
    GameStatus,
    UNIT_STATS,
    BUILDING_STATS,
)
from rules import GameRules
from validate import MoveValidator
from state import GameStateManager


class TestGameRules(unittest.TestCase):
    """Test game rules and mechanics."""

    def test_hex_distance_same_position(self):
        """Distance to same hex should be 0."""
        self.assertEqual(GameRules.hex_distance((0, 0), (0, 0)), 0)
        self.assertEqual(GameRules.hex_distance((5, 5), (5, 5)), 0)

    def test_hex_distance_adjacent(self):
        """Adjacent hexes should have distance 1."""
        # Test all 6 adjacent directions from (0, 0)
        adjacent = [(1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1), (1, -1)]
        for aq, ar in adjacent:
            self.assertEqual(GameRules.hex_distance((0, 0), (aq, ar)), 1)

    def test_hex_distance_farther(self):
        """Test distances for hexes further away."""
        self.assertEqual(GameRules.hex_distance((0, 0), (2, 0)), 2)
        self.assertEqual(GameRules.hex_distance((0, 0), (3, 0)), 3)
        self.assertEqual(GameRules.hex_distance((0, 0), (1, 1)), 2)

    def test_hex_neighbors(self):
        """Get all 6 neighbors of a hex."""
        neighbors = GameRules.hex_neighbors(5, 5)
        self.assertEqual(len(neighbors), 6)
        # All neighbors should be distance 1 away
        for nq, nr in neighbors:
            self.assertEqual(GameRules.hex_distance((5, 5), (nq, nr)), 1)

    def test_terrain_defense_bonus(self):
        """Test terrain defense bonuses."""
        self.assertEqual(GameRules.get_terrain_defense_bonus(TerrainType.GRASS), 0)
        self.assertEqual(GameRules.get_terrain_defense_bonus(TerrainType.FOREST), 1)
        self.assertEqual(GameRules.get_terrain_defense_bonus(TerrainType.MOUNTAIN), 2)
        self.assertEqual(GameRules.get_terrain_defense_bonus(TerrainType.WATER), 0)

    def test_unit_stats(self):
        """Test unit statistics from schemas."""
        worker = UNIT_STATS[UnitType.WORKER]
        self.assertEqual(worker["cost"], 25)
        self.assertEqual(worker["strength"], 0)
        self.assertEqual(worker["movement"], 2)

        knight = UNIT_STATS[UnitType.KNIGHT]
        self.assertEqual(knight["cost"], 75)
        self.assertEqual(knight["strength"], 6)
        self.assertEqual(knight["movement"], 3)

    def test_building_stats(self):
        """Test building statistics from schemas."""
        castle = BUILDING_STATS[BuildingType.CASTLE]
        self.assertEqual(castle["hp"], 10)
        self.assertEqual(castle["cost"], 0)  # Castle is free

        barracks = BUILDING_STATS[BuildingType.BARRACKS]
        self.assertEqual(barracks["cost"], 100)
        self.assertEqual(barracks["hp"], 5)


class TestMoveValidator(unittest.TestCase):
    """Test move validation logic."""

    def setUp(self):
        """Create a basic game state for testing."""
        # Create tiles
        tiles = []
        for q in range(20):
            for r in range(20):
                owner = None
                if q < 5:
                    owner = TribeColor.RED
                elif q > 15:
                    owner = TribeColor.BLUE
                tiles.append(Tile(q=q, r=r, terrain=TerrainType.GRASS, owner=owner))

        game_map = GameMap(width=20, height=20, tiles=tiles)

        units = [
            Unit(id=0, type=UnitType.KNIGHT, tribe=TribeColor.RED, position=(2, 2)),
            Unit(id=1, type=UnitType.WORKER, tribe=TribeColor.RED, position=(3, 3)),
            Unit(id=2, type=UnitType.WARRIOR, tribe=TribeColor.BLUE, position=(17, 17)),
        ]

        buildings = [
            Building(id=0, type=BuildingType.CASTLE, tribe=TribeColor.RED, position=(1, 1), hp=10),
            Building(id=1, type=BuildingType.CASTLE, tribe=TribeColor.BLUE, position=(18, 18), hp=10),
        ]

        tribes = {
            TribeColor.RED: TribeState(gold=100, alive=True),
            TribeColor.BLUE: TribeState(gold=100, alive=True),
            TribeColor.GREEN: TribeState(gold=100, alive=True),
            TribeColor.YELLOW: TribeState(gold=100, alive=True),
        }

        self.game_state = GameState(
            game_id="test_001",
            turn=1,
            current_tribe=TribeColor.RED,
            status=GameStatus.IN_PROGRESS,
            map=game_map,
            units=units,
            buildings=buildings,
            tribes=tribes,
            history=[],
            gold_mines=[],
        )

    def test_validate_move_own_unit(self):
        """Can move own unit to adjacent hex."""
        action = Action(action=ActionType.MOVE, unit_id=0, target=(3, 2))
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertTrue(valid, f"Move should be valid: {error}")

    def test_validate_move_enemy_unit(self):
        """Cannot move enemy unit (wrong tribe's turn)."""
        action = Action(action=ActionType.MOVE, unit_id=2, target=(16, 17))  # BLUE unit
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertFalse(valid)

    def test_validate_move_too_far(self):
        """Cannot move unit beyond movement range."""
        action = Action(action=ActionType.MOVE, unit_id=0, target=(10, 10))  # Too far
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertFalse(valid)

    def test_validate_move_nonexistent_unit(self):
        """Cannot move unit that doesn't exist."""
        action = Action(action=ActionType.MOVE, unit_id=999, target=(5, 5))
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertFalse(valid)

    def test_validate_train_at_castle(self):
        """Can train unit at castle if position is free."""
        # Clear the position first
        self.game_state.units = [u for u in self.game_state.units if u.position != (1, 1)]

        action = Action(action=ActionType.TRAIN, building_id=0, unit_type=UnitType.WARRIOR)
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertTrue(valid, f"Train should be valid: {error}")

    def test_validate_train_insufficient_gold(self):
        """Cannot train if insufficient gold."""
        self.game_state.tribes[TribeColor.RED].gold = 0

        action = Action(action=ActionType.TRAIN, building_id=0, unit_type=UnitType.KNIGHT)
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertFalse(valid)

    def test_validate_build_outside_territory(self):
        """Cannot build outside territory."""
        action = Action(action=ActionType.BUILD, building=BuildingType.BARRACKS, position=(10, 10))
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertFalse(valid)

    def test_validate_build_in_territory(self):
        """Can build in own territory."""
        action = Action(action=ActionType.BUILD, building=BuildingType.BARRACKS, position=(2, 1))
        valid, error = MoveValidator.validate(self.game_state, TribeColor.RED, action)
        self.assertTrue(valid, f"Build should be valid: {error}")


class TestGameStateManager(unittest.TestCase):
    """Test game state management."""

    def setUp(self):
        """Create a temporary directory for test files."""
        self.test_dir = tempfile.mkdtemp()
        self.state_file = os.path.join(self.test_dir, "gamestate.json")

    def tearDown(self):
        """Clean up test files."""
        if os.path.exists(self.state_file):
            os.remove(self.state_file)
        os.rmdir(self.test_dir)

    def test_create_new_game(self):
        """Create a new game state."""
        manager = GameStateManager.create_new_game("test_game_001")
        manager.save(self.state_file)

        self.assertTrue(os.path.exists(self.state_file))

        # Load and verify
        loaded_manager = GameStateManager.load(self.state_file)
        state = loaded_manager.state
        self.assertEqual(state.turn, 1)
        self.assertEqual(state.current_tribe, TribeColor.RED)
        self.assertEqual(state.status, GameStatus.IN_PROGRESS)
        self.assertEqual(len(state.map.tiles), 400)  # 20x20

        # Check starting gold
        for tribe_state in state.tribes.values():
            self.assertEqual(tribe_state.gold, 100)
            self.assertTrue(tribe_state.alive)


class TestSerialization(unittest.TestCase):
    """Test JSON serialization/deserialization."""

    def test_action_serialization(self):
        """Test Action to/from dict."""
        action = Action(action=ActionType.MOVE, unit_id=5, target=(10, 15))
        data = action.to_dict()

        self.assertEqual(data["action"], "MOVE")
        self.assertEqual(data["unit_id"], 5)
        self.assertEqual(data["target"], [10, 15])

        # Deserialize
        restored = Action.from_dict(data)
        self.assertEqual(restored.action, action.action)
        self.assertEqual(restored.unit_id, action.unit_id)
        self.assertEqual(restored.target, action.target)

    def test_unit_serialization(self):
        """Test Unit to/from dict."""
        unit = Unit(id=0, type=UnitType.KNIGHT, tribe=TribeColor.RED, position=(5, 10))
        data = unit.to_dict()

        self.assertEqual(data["id"], 0)
        self.assertEqual(data["type"], "KNIGHT")
        self.assertEqual(data["tribe"], "RED")
        self.assertEqual(data["position"], [5, 10])

        # Deserialize
        restored = Unit.from_dict(data)
        self.assertEqual(restored.id, unit.id)
        self.assertEqual(restored.type, unit.type)
        self.assertEqual(restored.tribe, unit.tribe)
        self.assertEqual(restored.position, unit.position)

    def test_building_serialization(self):
        """Test Building to/from dict."""
        building = Building(id=1, type=BuildingType.CASTLE, tribe=TribeColor.BLUE, position=(18, 18), hp=10)
        data = building.to_dict()

        self.assertEqual(data["id"], 1)
        self.assertEqual(data["type"], "CASTLE")
        self.assertEqual(data["tribe"], "BLUE")
        self.assertEqual(data["position"], [18, 18])

        # Deserialize
        restored = Building.from_dict(data)
        self.assertEqual(restored.id, building.id)
        self.assertEqual(restored.type, building.type)
        self.assertEqual(restored.position, building.position)

    def test_tile_serialization(self):
        """Test Tile to/from dict."""
        tile = Tile(q=5, r=10, terrain=TerrainType.FOREST, owner=TribeColor.RED)
        data = tile.to_dict()

        self.assertEqual(data["q"], 5)
        self.assertEqual(data["r"], 10)
        self.assertEqual(data["terrain"], "FOREST")
        self.assertEqual(data["owner"], "RED")

        # Deserialize
        restored = Tile.from_dict(data)
        self.assertEqual(restored.q, tile.q)
        self.assertEqual(restored.r, tile.r)
        self.assertEqual(restored.terrain, tile.terrain)
        self.assertEqual(restored.owner, tile.owner)

    def test_game_state_round_trip(self):
        """Test full GameState serialization round trip."""
        tiles = [Tile(q=0, r=0, terrain=TerrainType.GRASS, owner=None)]
        game_map = GameMap(width=1, height=1, tiles=tiles)

        units = [Unit(id=0, type=UnitType.KNIGHT, tribe=TribeColor.RED, position=(0, 0))]
        buildings = [Building(id=0, type=BuildingType.CASTLE, tribe=TribeColor.RED, position=(0, 0), hp=10)]
        tribes = {
            TribeColor.RED: TribeState(gold=100, alive=True),
            TribeColor.BLUE: TribeState(gold=100, alive=True),
            TribeColor.GREEN: TribeState(gold=100, alive=True),
            TribeColor.YELLOW: TribeState(gold=100, alive=True),
        }

        state = GameState(
            game_id="test",
            turn=5,
            current_tribe=TribeColor.BLUE,
            status=GameStatus.IN_PROGRESS,
            map=game_map,
            units=units,
            buildings=buildings,
            tribes=tribes,
            history=[],
            gold_mines=[],
        )

        # Round trip through JSON
        json_str = state.to_json()
        restored = GameState.from_json(json_str)

        self.assertEqual(restored.game_id, state.game_id)
        self.assertEqual(restored.turn, state.turn)
        self.assertEqual(restored.current_tribe, state.current_tribe)
        self.assertEqual(len(restored.units), len(state.units))
        self.assertEqual(len(restored.buildings), len(state.buildings))


if __name__ == "__main__":
    unittest.main()
