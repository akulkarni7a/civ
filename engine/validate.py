"""
Move validation logic.
"""

from typing import Optional
from schemas import (
    GameState,
    Action,
    ActionType,
    TribeColor,
)
from rules import GameRules


class ValidationError(Exception):
    """Raised when a move is invalid."""
    pass


class MoveValidator:
    """Validates moves submitted by tribes."""

    @staticmethod
    def validate(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """
        Validate an action for the given tribe.
        Returns (is_valid, error_message).
        """
        # Check it's the tribe's turn
        if state.current_tribe != tribe:
            return False, f"Not {tribe.value}'s turn (current: {state.current_tribe.value})"

        # Check tribe is alive
        if not state.tribes[tribe].alive:
            return False, f"{tribe.value} has been eliminated"

        # Validate based on action type
        if action.action == ActionType.MOVE:
            return MoveValidator._validate_move(state, tribe, action)
        elif action.action == ActionType.ATTACK:
            return MoveValidator._validate_attack(state, tribe, action)
        elif action.action == ActionType.BUILD:
            return MoveValidator._validate_build(state, tribe, action)
        elif action.action == ActionType.TRAIN:
            return MoveValidator._validate_train(state, tribe, action)
        elif action.action == ActionType.HARVEST:
            return MoveValidator._validate_harvest(state, tribe, action)
        elif action.action == ActionType.SETTLE:
            return MoveValidator._validate_settle(state, tribe, action)
        else:
            return False, f"Unknown action type: {action.action}"

    @staticmethod
    def _validate_move(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """Validate a MOVE action."""
        if action.unit_id is None:
            return False, "MOVE requires unit_id"
        if action.target is None:
            return False, "MOVE requires target"

        unit = state.get_unit(action.unit_id)
        if not unit:
            return False, f"Unit {action.unit_id} not found"

        if unit.tribe != tribe:
            return False, "Cannot move another tribe's unit"

        return GameRules.can_move(state, unit, action.target)

    @staticmethod
    def _validate_attack(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """Validate an ATTACK action."""
        if action.unit_id is None:
            return False, "ATTACK requires unit_id"
        if action.target_id is None:
            return False, "ATTACK requires target_id"

        unit = state.get_unit(action.unit_id)
        if not unit:
            return False, f"Unit {action.unit_id} not found"

        if unit.tribe != tribe:
            return False, "Cannot attack with another tribe's unit"

        return GameRules.can_attack(state, unit, action.target_id)

    @staticmethod
    def _validate_build(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """Validate a BUILD action."""
        if action.building is None:
            return False, "BUILD requires building type"
        if action.position is None:
            return False, "BUILD requires position"

        return GameRules.can_build(state, tribe, action.building, action.position)

    @staticmethod
    def _validate_train(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """Validate a TRAIN action."""
        if action.unit_type is None:
            return False, "TRAIN requires unit_type"
        if action.building_id is None:
            return False, "TRAIN requires building_id"

        return GameRules.can_train_unit(state, tribe, action.unit_type, action.building_id)

    @staticmethod
    def _validate_harvest(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """Validate a HARVEST action."""
        if action.unit_id is None:
            return False, "HARVEST requires unit_id"
        if action.mine_id is None:
            return False, "HARVEST requires mine_id"

        unit = state.get_unit(action.unit_id)
        if not unit:
            return False, f"Unit {action.unit_id} not found"

        if unit.tribe != tribe:
            return False, "Cannot harvest with another tribe's unit"

        return GameRules.can_harvest(state, unit, action.mine_id)

    @staticmethod
    def _validate_settle(state: GameState, tribe: TribeColor, action: Action) -> tuple[bool, str]:
        """Validate a SETTLE action."""
        if action.unit_id is None:
            return False, "SETTLE requires unit_id"
        if action.target is None:
            return False, "SETTLE requires target"

        unit = state.get_unit(action.unit_id)
        if not unit:
            return False, f"Unit {action.unit_id} not found"

        if unit.tribe != tribe:
            return False, "Cannot settle with another tribe's unit"

        return GameRules.can_settle(state, unit, action.target)
