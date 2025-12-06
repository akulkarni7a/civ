"""
Game rules and mechanics.
"""

import random
from typing import Optional
from schemas import (
    GameState,
    Action,
    ActionType,
    TribeColor,
    TerrainType,
    UnitType,
    BuildingType,
    Unit,
    Building,
    Tile,
    UNIT_STATS,
    BUILDING_STATS,
    GOLD_PER_WORKER,
)


class GameRules:
    """Implements all game rules and mechanics."""

    @staticmethod
    def hex_distance(a: tuple[int, int], b: tuple[int, int]) -> int:
        """Calculate distance between two hex coordinates."""
        # Convert axial to cube coordinates
        ax, az = a
        ay = -ax - az
        bx, bz = b
        by = -bx - bz
        return max(abs(ax - bx), abs(ay - by), abs(az - bz))

    @staticmethod
    def hex_neighbors(q: int, r: int) -> list[tuple[int, int]]:
        """Get all 6 neighboring hex coordinates."""
        directions = [
            (1, 0), (1, -1), (0, -1),
            (-1, 0), (-1, 1), (0, 1)
        ]
        return [(q + dq, r + dr) for dq, dr in directions]

    @staticmethod
    def is_valid_position(state: GameState, q: int, r: int) -> bool:
        """Check if position is within map bounds."""
        return 0 <= q < state.map.width and 0 <= r < state.map.height

    @staticmethod
    def is_passable(state: GameState, q: int, r: int) -> bool:
        """Check if a hex is passable (not water or mountain for most units)."""
        tile = state.map.get_tile(q, r)
        if not tile:
            return False
        return tile.terrain not in [TerrainType.WATER, TerrainType.MOUNTAIN]

    @staticmethod
    def is_owned_by(state: GameState, q: int, r: int, tribe: TribeColor) -> bool:
        """Check if a hex is owned by the given tribe."""
        tile = state.map.get_tile(q, r)
        return tile is not None and tile.owner == tribe

    @staticmethod
    def get_terrain_defense_bonus(terrain: TerrainType) -> int:
        """Get defense bonus for terrain type."""
        bonuses = {
            TerrainType.FOREST: 1,
            TerrainType.MOUNTAIN: 2,
        }
        return bonuses.get(terrain, 0)

    @staticmethod
    def get_adjacent_tower_bonus(state: GameState, q: int, r: int, tribe: TribeColor) -> int:
        """Get defense bonus from adjacent friendly towers."""
        bonus = 0
        for nq, nr in GameRules.hex_neighbors(q, r):
            building = state.get_building_at(nq, nr)
            if building and building.type == BuildingType.TOWER and building.tribe == tribe:
                bonus += 2
        return bonus

    @staticmethod
    def resolve_combat(
        attacker: Unit,
        defender: Unit,
        state: GameState,
        attacker_is_ranged: bool = False
    ) -> tuple[bool, int, int]:
        """
        Resolve combat between two units.
        Returns: (attacker_wins, attacker_roll, defender_roll)
        """
        attacker_stats = UNIT_STATS[attacker.type]
        defender_stats = UNIT_STATS[defender.type]

        # Base strength
        attacker_strength = attacker_stats["strength"]
        defender_strength = defender_stats["strength"]

        # Ranged penalty for archers
        if attacker_is_ranged and attacker.type == UnitType.ARCHER:
            attacker_strength -= 1

        # Terrain bonus for defender
        defender_tile = state.map.get_tile(*defender.position)
        if defender_tile:
            defender_strength += GameRules.get_terrain_defense_bonus(defender_tile.terrain)

        # Tower bonus for defender
        defender_strength += GameRules.get_adjacent_tower_bonus(
            state, defender.position[0], defender.position[1], defender.tribe
        )

        # Roll dice
        attacker_roll = random.randint(1, 6)
        defender_roll = random.randint(1, 6)

        attacker_total = attacker_strength + attacker_roll
        defender_total = defender_strength + defender_roll

        # Attacker wins if strictly greater
        attacker_wins = attacker_total > defender_total

        return attacker_wins, attacker_roll, defender_roll

    @staticmethod
    def can_train_unit(state: GameState, tribe: TribeColor, unit_type: UnitType, building_id: int) -> tuple[bool, str]:
        """Check if a tribe can train a specific unit at a building."""
        tribe_state = state.tribes.get(tribe)
        if not tribe_state or not tribe_state.alive:
            return False, "Tribe is not alive"

        building = state.get_building(building_id)
        if not building:
            return False, "Building not found"

        if building.tribe != tribe:
            return False, "Building belongs to another tribe"

        # Check building type requirements
        if unit_type in [UnitType.WARRIOR, UnitType.ARCHER, UnitType.KNIGHT]:
            if building.type not in [BuildingType.CASTLE, BuildingType.BARRACKS]:
                return False, "Must train combat units at Castle or Barracks"
        elif unit_type in [UnitType.WORKER, UnitType.SETTLER]:
            if building.type != BuildingType.CASTLE:
                return False, "Must train workers and settlers at Castle"

        # Check gold
        cost = UNIT_STATS[unit_type]["cost"]
        if tribe_state.gold < cost:
            return False, f"Not enough gold (need {cost}, have {tribe_state.gold})"

        # Check if position is free
        units_at_building = state.get_units_at(*building.position)
        if len(units_at_building) > 0:
            return False, "Building position is occupied"

        return True, ""

    @staticmethod
    def can_build(state: GameState, tribe: TribeColor, building_type: BuildingType, position: tuple[int, int]) -> tuple[bool, str]:
        """Check if a tribe can build at the given position."""
        tribe_state = state.tribes.get(tribe)
        if not tribe_state or not tribe_state.alive:
            return False, "Tribe is not alive"

        q, r = position

        # Check bounds
        if not GameRules.is_valid_position(state, q, r):
            return False, "Position out of bounds"

        # Check ownership
        if not GameRules.is_owned_by(state, q, r, tribe):
            return False, "Must build on owned territory"

        # Check if passable
        if not GameRules.is_passable(state, q, r):
            return False, "Cannot build on water or mountains"

        # Check if position is free
        if state.get_building_at(q, r):
            return False, "Position already has a building"

        # Check gold
        cost = BUILDING_STATS[building_type]["cost"]
        if tribe_state.gold < cost:
            return False, f"Not enough gold (need {cost}, have {tribe_state.gold})"

        return True, ""

    @staticmethod
    def can_move(state: GameState, unit: Unit, target: tuple[int, int]) -> tuple[bool, str]:
        """Check if a unit can move to the target position."""
        if unit.tribe != state.current_tribe:
            return False, "Not your turn"

        tq, tr = target

        # Check bounds
        if not GameRules.is_valid_position(state, tq, tr):
            return False, "Target out of bounds"

        # Check passability
        if not GameRules.is_passable(state, tq, tr):
            return False, "Target is not passable"

        # Check distance
        distance = GameRules.hex_distance(unit.position, target)
        max_movement = UNIT_STATS[unit.type]["movement"]
        if distance > max_movement:
            return False, f"Target too far (max {max_movement} hexes)"

        # Check if target has enemy unit
        units_at_target = state.get_units_at(tq, tr)
        enemy_units = [u for u in units_at_target if u.tribe != unit.tribe]
        if enemy_units:
            return False, "Target has enemy unit (use ATTACK action)"

        # Check if target has enemy building (walls block movement)
        building_at_target = state.get_building_at(tq, tr)
        if building_at_target and building_at_target.tribe != unit.tribe:
            if building_at_target.type == BuildingType.WALL:
                return False, "Wall blocks movement"

        return True, ""

    @staticmethod
    def can_attack(state: GameState, attacker: Unit, target_id: int) -> tuple[bool, str]:
        """Check if a unit can attack the target."""
        if attacker.tribe != state.current_tribe:
            return False, "Not your turn"

        defender = state.get_unit(target_id)
        if not defender:
            return False, "Target unit not found"

        if defender.tribe == attacker.tribe:
            return False, "Cannot attack friendly units"

        # Check range
        distance = GameRules.hex_distance(attacker.position, defender.position)

        if attacker.type == UnitType.ARCHER:
            # Archers can attack up to 2 hexes away
            if distance > 2:
                return False, "Target too far for archer (max 2 hexes)"
        else:
            # Melee units must be adjacent
            if distance > 1:
                return False, "Must be adjacent to attack"

        # Non-combat units can't attack
        if UNIT_STATS[attacker.type]["strength"] == 0:
            return False, "This unit cannot attack"

        return True, ""

    @staticmethod
    def can_harvest(state: GameState, unit: Unit, mine_id: int) -> tuple[bool, str]:
        """Check if a worker can harvest a gold mine."""
        if unit.tribe != state.current_tribe:
            return False, "Not your turn"

        if unit.type != UnitType.WORKER:
            return False, "Only workers can harvest"

        mine = state.get_mine(mine_id)
        if not mine:
            return False, "Mine not found"

        # Check if worker is at mine position
        if unit.position != mine.position:
            return False, "Worker must be at mine position"

        # Check if mine is in owned territory
        if not GameRules.is_owned_by(state, mine.position[0], mine.position[1], unit.tribe):
            return False, "Mine must be in your territory"

        # Check if mine is already occupied
        if mine.worker_id is not None and mine.worker_id != unit.id:
            return False, "Mine is already being harvested"

        return True, ""

    @staticmethod
    def can_settle(state: GameState, unit: Unit, target: tuple[int, int]) -> tuple[bool, str]:
        """Check if a settler can expand territory to the target hex."""
        if unit.tribe != state.current_tribe:
            return False, "Not your turn"

        if unit.type != UnitType.SETTLER:
            return False, "Only settlers can settle"

        tq, tr = target

        # Check bounds
        if not GameRules.is_valid_position(state, tq, tr):
            return False, "Target out of bounds"

        # Target must be adjacent to settler
        if GameRules.hex_distance(unit.position, target) > 1:
            return False, "Target must be adjacent"

        # Target must be neutral (not owned)
        tile = state.map.get_tile(tq, tr)
        if not tile:
            return False, "Invalid target"

        if tile.owner is not None:
            return False, "Target is already owned"

        # Target must be adjacent to existing territory
        neighbors = GameRules.hex_neighbors(tq, tr)
        has_adjacent_territory = any(
            GameRules.is_owned_by(state, nq, nr, unit.tribe)
            for nq, nr in neighbors
        )
        if not has_adjacent_territory:
            return False, "Target must be adjacent to your territory"

        return True, ""

    @staticmethod
    def collect_income(state: GameState) -> dict[TribeColor, int]:
        """Calculate income from workers at gold mines."""
        income = {tribe: 0 for tribe in TribeColor}

        for mine in state.gold_mines:
            if mine.worker_id is not None:
                worker = state.get_unit(mine.worker_id)
                if worker and worker.type == UnitType.WORKER:
                    income[worker.tribe] += GOLD_PER_WORKER

        return income

    @staticmethod
    def get_next_tribe(current: TribeColor, state: GameState) -> TribeColor:
        """Get the next tribe in turn order, skipping eliminated tribes."""
        order = [TribeColor.RED, TribeColor.BLUE, TribeColor.GREEN, TribeColor.YELLOW]
        current_idx = order.index(current)

        for i in range(1, 5):
            next_idx = (current_idx + i) % 4
            next_tribe = order[next_idx]
            if state.tribes[next_tribe].alive:
                return next_tribe

        # If no other tribe is alive, return current (shouldn't happen)
        return current

    @staticmethod
    def check_victory(state: GameState) -> Optional[TribeColor]:
        """Check if there's a winner (only one tribe with a castle remaining)."""
        alive_tribes = [tribe for tribe, ts in state.tribes.items() if ts.alive]

        if len(alive_tribes) == 1:
            return alive_tribes[0]

        return None
