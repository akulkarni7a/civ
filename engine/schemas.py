"""
Game state schemas and type definitions.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import json


class TribeColor(str, Enum):
    RED = "RED"
    BLUE = "BLUE"
    GREEN = "GREEN"
    YELLOW = "YELLOW"


class TerrainType(str, Enum):
    GRASS = "GRASS"
    FOREST = "FOREST"
    MOUNTAIN = "MOUNTAIN"
    WATER = "WATER"
    GOLD_MINE = "GOLD_MINE"


class UnitType(str, Enum):
    WORKER = "WORKER"
    SETTLER = "SETTLER"
    WARRIOR = "WARRIOR"
    ARCHER = "ARCHER"
    KNIGHT = "KNIGHT"


class BuildingType(str, Enum):
    CASTLE = "CASTLE"
    BARRACKS = "BARRACKS"
    TOWER = "TOWER"
    WALL = "WALL"


class ActionType(str, Enum):
    MOVE = "MOVE"
    ATTACK = "ATTACK"
    BUILD = "BUILD"
    TRAIN = "TRAIN"
    HARVEST = "HARVEST"
    SETTLE = "SETTLE"


class GameStatus(str, Enum):
    LOBBY = "LOBBY"
    IN_PROGRESS = "IN_PROGRESS"
    FINISHED = "FINISHED"


# Unit stats: cost, strength, movement
UNIT_STATS = {
    UnitType.WORKER: {"cost": 25, "strength": 0, "movement": 2},
    UnitType.SETTLER: {"cost": 50, "strength": 0, "movement": 2},
    UnitType.WARRIOR: {"cost": 30, "strength": 3, "movement": 2},
    UnitType.ARCHER: {"cost": 40, "strength": 2, "movement": 2},
    UnitType.KNIGHT: {"cost": 75, "strength": 6, "movement": 3},
}

# Building stats: cost, hp
BUILDING_STATS = {
    BuildingType.CASTLE: {"cost": 0, "hp": 10},
    BuildingType.BARRACKS: {"cost": 100, "hp": 5},
    BuildingType.TOWER: {"cost": 75, "hp": 3},
    BuildingType.WALL: {"cost": 25, "hp": 5},
}

# Gold per turn for workers on mines
GOLD_PER_WORKER = 10

# Starting gold
STARTING_GOLD = 100


@dataclass
class Tile:
    q: int
    r: int
    terrain: TerrainType
    owner: Optional[TribeColor] = None

    def to_dict(self) -> dict:
        return {
            "q": self.q,
            "r": self.r,
            "terrain": self.terrain.value,
            "owner": self.owner.value if self.owner else None,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Tile":
        return cls(
            q=data["q"],
            r=data["r"],
            terrain=TerrainType(data["terrain"]),
            owner=TribeColor(data["owner"]) if data.get("owner") else None,
        )


@dataclass
class Unit:
    id: int
    tribe: TribeColor
    type: UnitType
    position: tuple[int, int]  # (q, r)
    can_act: bool = True
    harvesting: Optional[int] = None  # mine_id if harvesting

    def to_dict(self) -> dict:
        result = {
            "id": self.id,
            "tribe": self.tribe.value,
            "type": self.type.value,
            "position": list(self.position),
            "canAct": self.can_act,
        }
        if self.harvesting is not None:
            result["harvesting"] = self.harvesting
        return result

    @classmethod
    def from_dict(cls, data: dict) -> "Unit":
        return cls(
            id=data["id"],
            tribe=TribeColor(data["tribe"]),
            type=UnitType(data["type"]),
            position=tuple(data["position"]),
            can_act=data.get("canAct", True),
            harvesting=data.get("harvesting"),
        )


@dataclass
class Building:
    id: int
    tribe: TribeColor
    type: BuildingType
    position: tuple[int, int]  # (q, r)
    hp: int

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tribe": self.tribe.value,
            "type": self.type.value,
            "position": list(self.position),
            "hp": self.hp,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Building":
        return cls(
            id=data["id"],
            tribe=TribeColor(data["tribe"]),
            type=BuildingType(data["type"]),
            position=tuple(data["position"]),
            hp=data["hp"],
        )


@dataclass
class GoldMine:
    id: int
    position: tuple[int, int]  # (q, r)
    worker_id: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "position": list(self.position),
            "workerId": self.worker_id,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "GoldMine":
        return cls(
            id=data["id"],
            position=tuple(data["position"]),
            worker_id=data.get("workerId"),
        )


@dataclass
class TribeState:
    gold: int
    alive: bool = True

    def to_dict(self) -> dict:
        return {"gold": self.gold, "alive": self.alive}

    @classmethod
    def from_dict(cls, data: dict) -> "TribeState":
        return cls(gold=data["gold"], alive=data.get("alive", True))


@dataclass
class GameAction:
    turn: int
    tribe: TribeColor
    action: ActionType
    details: dict

    def to_dict(self) -> dict:
        return {
            "turn": self.turn,
            "tribe": self.tribe.value,
            "action": self.action.value,
            "details": self.details,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "GameAction":
        return cls(
            turn=data["turn"],
            tribe=TribeColor(data["tribe"]),
            action=ActionType(data["action"]),
            details=data["details"],
        )


@dataclass
class GameMap:
    width: int
    height: int
    tiles: list[Tile]

    def to_dict(self) -> dict:
        return {
            "width": self.width,
            "height": self.height,
            "tiles": [t.to_dict() for t in self.tiles],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "GameMap":
        return cls(
            width=data["width"],
            height=data["height"],
            tiles=[Tile.from_dict(t) for t in data.get("tiles", [])],
        )

    def get_tile(self, q: int, r: int) -> Optional[Tile]:
        for tile in self.tiles:
            if tile.q == q and tile.r == r:
                return tile
        return None

    def set_tile_owner(self, q: int, r: int, owner: Optional[TribeColor]) -> bool:
        tile = self.get_tile(q, r)
        if tile:
            tile.owner = owner
            return True
        return False


@dataclass
class GameState:
    game_id: str
    turn: int
    current_tribe: TribeColor
    status: GameStatus
    map: GameMap
    tribes: dict[TribeColor, TribeState]
    units: list[Unit]
    buildings: list[Building]
    gold_mines: list[GoldMine]
    history: list[GameAction] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "gameId": self.game_id,
            "turn": self.turn,
            "currentTribe": self.current_tribe.value,
            "status": self.status.value,
            "map": self.map.to_dict(),
            "tribes": {k.value: v.to_dict() for k, v in self.tribes.items()},
            "units": [u.to_dict() for u in self.units],
            "buildings": [b.to_dict() for b in self.buildings],
            "goldMines": [g.to_dict() for g in self.gold_mines],
            "history": [h.to_dict() for h in self.history],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "GameState":
        return cls(
            game_id=data["gameId"],
            turn=data["turn"],
            current_tribe=TribeColor(data["currentTribe"]),
            status=GameStatus(data["status"]),
            map=GameMap.from_dict(data["map"]),
            tribes={TribeColor(k): TribeState.from_dict(v) for k, v in data["tribes"].items()},
            units=[Unit.from_dict(u) for u in data["units"]],
            buildings=[Building.from_dict(b) for b in data["buildings"]],
            gold_mines=[GoldMine.from_dict(g) for g in data["goldMines"]],
            history=[GameAction.from_dict(h) for h in data.get("history", [])],
        )

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_json(cls, json_str: str) -> "GameState":
        return cls.from_dict(json.loads(json_str))

    def get_unit(self, unit_id: int) -> Optional[Unit]:
        for unit in self.units:
            if unit.id == unit_id:
                return unit
        return None

    def get_building(self, building_id: int) -> Optional[Building]:
        for building in self.buildings:
            if building.id == building_id:
                return building
        return None

    def get_mine(self, mine_id: int) -> Optional[GoldMine]:
        for mine in self.gold_mines:
            if mine.id == mine_id:
                return mine
        return None

    def get_units_at(self, q: int, r: int) -> list[Unit]:
        return [u for u in self.units if u.position == (q, r)]

    def get_building_at(self, q: int, r: int) -> Optional[Building]:
        for building in self.buildings:
            if building.position == (q, r):
                return building
        return None


@dataclass
class Action:
    """Represents a single action from a tribe's strategy."""
    action: ActionType
    unit_id: Optional[int] = None
    target: Optional[tuple[int, int]] = None
    target_id: Optional[int] = None
    building: Optional[BuildingType] = None
    unit_type: Optional[UnitType] = None
    building_id: Optional[int] = None
    mine_id: Optional[int] = None
    position: Optional[tuple[int, int]] = None

    def to_dict(self) -> dict:
        result = {"action": self.action.value}
        if self.unit_id is not None:
            result["unit_id"] = self.unit_id
        if self.target is not None:
            result["target"] = list(self.target)
        if self.target_id is not None:
            result["target_id"] = self.target_id
        if self.building is not None:
            result["building"] = self.building.value
        if self.unit_type is not None:
            result["unit_type"] = self.unit_type.value
        if self.building_id is not None:
            result["building_id"] = self.building_id
        if self.mine_id is not None:
            result["mine_id"] = self.mine_id
        if self.position is not None:
            result["position"] = list(self.position)
        return result

    @classmethod
    def from_dict(cls, data: dict) -> "Action":
        return cls(
            action=ActionType(data["action"]),
            unit_id=data.get("unit_id"),
            target=tuple(data["target"]) if data.get("target") else None,
            target_id=data.get("target_id"),
            building=BuildingType(data["building"]) if data.get("building") else None,
            unit_type=UnitType(data["unit_type"]) if data.get("unit_type") else None,
            building_id=data.get("building_id"),
            mine_id=data.get("mine_id"),
            position=tuple(data["position"]) if data.get("position") else None,
        )
