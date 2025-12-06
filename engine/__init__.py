"""
Git-vilization Game Engine

The core game logic for validating moves and updating game state.
"""

from schemas import GameState, Action, ActionType
from state import GameStateManager
from rules import GameRules
from validate import MoveValidator

__all__ = [
    'GameState',
    'Action',
    'ActionType',
    'GameStateManager',
    'GameRules',
    'MoveValidator',
]
