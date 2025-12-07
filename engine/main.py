#!/usr/bin/env python3
"""
Main entry point for the Git-vilization game engine.
Used by GitHub Actions to validate and apply moves.
"""

import sys
import json
import argparse
import importlib.util
from pathlib import Path
from typing import Optional

from schemas import GameState, Action, TribeColor
from state import GameStateManager
from validate import MoveValidator


def load_strategy(tribe: TribeColor) -> Optional[callable]:
    """Load a tribe's strategy module and return the get_action function."""
    # Try both relative paths (from engine/ and from project root)
    paths_to_try = [
        Path(f"../tribes/{tribe.value.lower()}/strategy.py"),  # From engine/
        Path(f"tribes/{tribe.value.lower()}/strategy.py"),     # From project root
    ]

    strategy_path = None
    for path in paths_to_try:
        if path.exists():
            strategy_path = path
            break

    if not strategy_path:
        print(f"Error: Strategy file not found. Tried: {', '.join(str(p) for p in paths_to_try)}")
        return None

    try:
        spec = importlib.util.spec_from_file_location(f"{tribe.value}_strategy", strategy_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if not hasattr(module, "get_action"):
            print(f"Error: Strategy file missing get_action function")
            return None

        return module.get_action
    except Exception as e:
        print(f"Error loading strategy: {e}")
        return None


def run_turn(gamestate_path: str, tribe: str, output_path: str) -> int:
    """
    Run a turn for the specified tribe.

    Returns:
        0 on success
        1 on validation error
        2 on execution error
    """
    # Load game state
    try:
        manager = GameStateManager.load(gamestate_path)
    except Exception as e:
        print(f"Error loading game state: {e}")
        return 2

    state = manager.state
    tribe_color = TribeColor(tribe.upper())

    # Check it's this tribe's turn
    if state.current_tribe != tribe_color:
        print(f"Error: Not {tribe}'s turn (current: {state.current_tribe.value})")
        return 1

    # Load and execute strategy
    get_action = load_strategy(tribe_color)
    if not get_action:
        return 2

    try:
        # Pass game state dict to strategy
        action_dict = get_action(state.to_dict())
        action = Action.from_dict(action_dict)
    except Exception as e:
        print(f"Error executing strategy: {e}")
        import traceback
        traceback.print_exc()
        return 2

    # Validate the action
    valid, error = MoveValidator.validate(state, tribe_color, action)
    if not valid:
        print(f"Invalid move: {error}")
        return 1

    # Apply the action
    success, message, diff = manager.apply_action(tribe_color, action)
    if not success:
        print(f"Failed to apply action: {message}")
        return 1

    # Save updated state
    manager.save(gamestate_path)

    # Save diff for preview
    with open(output_path, "w") as f:
        json.dump(diff, f, indent=2)

    print(f"Turn completed successfully")
    print(f"Action: {action.action.value}")
    print(f"Next tribe: {manager.state.current_tribe.value}")

    return 0


def validate_only(gamestate_path: str, tribe: str) -> int:
    """
    Validate a tribe's move without applying it.

    Returns:
        0 if valid
        1 if invalid
        2 on execution error
    """
    # Load game state
    try:
        manager = GameStateManager.load(gamestate_path)
    except Exception as e:
        print(f"Error loading game state: {e}")
        return 2

    state = manager.state
    tribe_color = TribeColor(tribe.upper())

    # Check it's this tribe's turn
    if state.current_tribe != tribe_color:
        print(f"Error: Not {tribe}'s turn (current: {state.current_tribe.value})")
        return 1

    # Load and execute strategy
    get_action = load_strategy(tribe_color)
    if not get_action:
        return 2

    try:
        action_dict = get_action(state.to_dict())
        action = Action.from_dict(action_dict)
    except Exception as e:
        print(f"Error executing strategy: {e}")
        import traceback
        traceback.print_exc()
        return 2

    # Validate the action
    valid, error = MoveValidator.validate(state, tribe_color, action)
    if not valid:
        print(f"Invalid move: {error}")
        return 1

    print(f"Move is valid: {action.action.value}")
    print(json.dumps(action.to_dict(), indent=2))
    return 0


def create_new_game(output_path: str, game_id: str) -> int:
    """Create a new game with default setup."""
    try:
        manager = GameStateManager.create_new_game(game_id)
        manager.save(output_path)
        print(f"Created new game: {game_id}")
        print(f"Saved to: {output_path}")
        return 0
    except Exception as e:
        print(f"Error creating game: {e}")
        return 2


def main():
    parser = argparse.ArgumentParser(description="Git-vilization Game Engine")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Run turn command
    run_parser = subparsers.add_parser("run", help="Run a turn for a tribe")
    run_parser.add_argument("--state", required=True, help="Path to gamestate.json")
    run_parser.add_argument("--tribe", required=True, help="Tribe color (RED, BLUE, GREEN, YELLOW)")
    run_parser.add_argument("--output", default="diff.json", help="Output path for diff")

    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a move without applying")
    validate_parser.add_argument("--state", required=True, help="Path to gamestate.json")
    validate_parser.add_argument("--tribe", required=True, help="Tribe color")

    # New game command
    new_parser = subparsers.add_parser("new", help="Create a new game")
    new_parser.add_argument("--output", default="data/gamestate.json", help="Output path")
    new_parser.add_argument("--id", default="game_001", help="Game ID")

    args = parser.parse_args()

    if args.command == "run":
        return run_turn(args.state, args.tribe, args.output)
    elif args.command == "validate":
        return validate_only(args.state, args.tribe)
    elif args.command == "new":
        return create_new_game(args.output, args.id)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
