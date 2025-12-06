"""
Jules Orchestrator for Git-vilization.

This module manages the turn-based flow of the game, coordinating
Jules sessions for each tribe and handling the PR merge workflow.
"""

import os
import json
import time
import logging
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from schemas import GameState, TribeColor, GameStatus
from state import GameStateManager
from jules_client import JulesClient, JulesSession, SessionStatus, create_tribe_prompt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TurnState:
    """State of the current turn."""
    tribe: TribeColor
    session_id: Optional[str] = None
    status: str = "pending"
    pr_url: Optional[str] = None
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error: Optional[str] = None


@dataclass
class OrchestratorState:
    """Persistent state for the orchestrator."""
    current_turn: TurnState = None
    completed_turns: list[dict] = field(default_factory=list)
    is_running: bool = False
    github_repo: str = ""
    github_owner: str = ""

    def to_dict(self) -> dict:
        return {
            "current_turn": {
                "tribe": self.current_turn.tribe.value if self.current_turn else None,
                "session_id": self.current_turn.session_id if self.current_turn else None,
                "status": self.current_turn.status if self.current_turn else None,
                "pr_url": self.current_turn.pr_url if self.current_turn else None,
            } if self.current_turn else None,
            "completed_turns": self.completed_turns,
            "is_running": self.is_running,
            "github_repo": self.github_repo,
            "github_owner": self.github_owner,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "OrchestratorState":
        state = cls()
        if data.get("current_turn"):
            ct = data["current_turn"]
            state.current_turn = TurnState(
                tribe=TribeColor(ct["tribe"]) if ct.get("tribe") else None,
                session_id=ct.get("session_id"),
                status=ct.get("status", "pending"),
                pr_url=ct.get("pr_url"),
            )
        state.completed_turns = data.get("completed_turns", [])
        state.is_running = data.get("is_running", False)
        state.github_repo = data.get("github_repo", "")
        state.github_owner = data.get("github_owner", "")
        return state


class JulesOrchestrator:
    """
    Orchestrates Jules sessions for Git-vilization gameplay.

    This class manages:
    - Creating Jules sessions for each tribe's turn
    - Polling for session completion
    - Handling PR creation and merge
    - Advancing the game state
    """

    def __init__(
        self,
        game_state_path: str,
        github_owner: str,
        github_repo: str,
        orchestrator_state_path: str = None,
    ):
        self.game_state_path = game_state_path
        self.github_owner = github_owner
        self.github_repo = github_repo
        self.source = f"sources/github/{github_owner}/{github_repo}"

        self.orchestrator_state_path = orchestrator_state_path or "data/orchestrator_state.json"

        self.jules = JulesClient()
        self.state = self._load_orchestrator_state()
        self.state.github_owner = github_owner
        self.state.github_repo = github_repo

    def _load_orchestrator_state(self) -> OrchestratorState:
        """Load orchestrator state from disk."""
        if os.path.exists(self.orchestrator_state_path):
            with open(self.orchestrator_state_path, "r") as f:
                return OrchestratorState.from_dict(json.load(f))
        return OrchestratorState()

    def _save_orchestrator_state(self):
        """Save orchestrator state to disk."""
        os.makedirs(os.path.dirname(self.orchestrator_state_path), exist_ok=True)
        with open(self.orchestrator_state_path, "w") as f:
            json.dump(self.state.to_dict(), f, indent=2)

    def _load_game_state(self) -> GameState:
        """Load the current game state."""
        manager = GameStateManager.load(self.game_state_path)
        return manager.state

    def get_status(self) -> dict:
        """Get the current orchestrator status."""
        game_state = self._load_game_state()

        return {
            "game_id": game_state.game_id,
            "turn": game_state.turn,
            "current_tribe": game_state.current_tribe.value,
            "game_status": game_state.status.value,
            "orchestrator": self.state.to_dict(),
        }

    def start_turn(self, community_prompts: dict[str, list[str]] = None) -> dict:
        """
        Start a new turn for the current tribe.

        Args:
            community_prompts: Optional dict of tribe -> list of community suggestions

        Returns:
            Status dict with session info
        """
        game_state = self._load_game_state()

        # Check game is still in progress
        if game_state.status != GameStatus.IN_PROGRESS:
            return {
                "success": False,
                "error": f"Game is {game_state.status.value}",
            }

        current_tribe = game_state.current_tribe
        tribe_prompts = (community_prompts or {}).get(current_tribe.value, [])

        logger.info(f"Starting turn for {current_tribe.value}")

        # Create the prompt for Jules
        prompt = create_tribe_prompt(
            tribe=current_tribe.value,
            game_state=game_state.to_dict(),
            community_prompts=tribe_prompts,
        )

        # Create Jules session
        try:
            session_id = self.jules.create_session(
                prompt=prompt,
                source=self.source,
                branch="main",
                title=f"[{current_tribe.value}] Turn {game_state.turn} Strategy",
                auto_pr=True,
                require_approval=False,
            )

            # Update orchestrator state
            self.state.current_turn = TurnState(
                tribe=current_tribe,
                session_id=session_id,
                status="executing",
                started_at=time.time(),
            )
            self.state.is_running = True
            self._save_orchestrator_state()

            logger.info(f"Created Jules session {session_id} for {current_tribe.value}")

            return {
                "success": True,
                "tribe": current_tribe.value,
                "session_id": session_id,
                "status": "executing",
            }

        except Exception as e:
            logger.error(f"Failed to create Jules session: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    def check_turn_status(self) -> dict:
        """
        Check the status of the current turn.

        Returns:
            Status dict with current state
        """
        if not self.state.current_turn:
            return {
                "status": "idle",
                "message": "No active turn",
            }

        turn = self.state.current_turn

        if turn.status == "completed":
            return {
                "status": "completed",
                "tribe": turn.tribe.value,
                "pr_url": turn.pr_url,
            }

        if turn.status == "failed":
            return {
                "status": "failed",
                "tribe": turn.tribe.value,
                "error": turn.error,
            }

        # Poll Jules for status
        try:
            status, result = self.jules.get_session_status(turn.session_id)

            if status == SessionStatus.COMPLETED:
                turn.status = "completed"
                turn.pr_url = result
                turn.completed_at = time.time()
                self._save_orchestrator_state()

                logger.info(f"Turn completed for {turn.tribe.value}: {result}")

                return {
                    "status": "completed",
                    "tribe": turn.tribe.value,
                    "pr_url": result,
                }

            elif status == SessionStatus.FAILED:
                turn.status = "failed"
                turn.error = result
                turn.completed_at = time.time()
                self._save_orchestrator_state()

                logger.error(f"Turn failed for {turn.tribe.value}: {result}")

                return {
                    "status": "failed",
                    "tribe": turn.tribe.value,
                    "error": result,
                }

            else:
                return {
                    "status": "executing",
                    "tribe": turn.tribe.value,
                    "session_id": turn.session_id,
                    "jules_status": status.value,
                }

        except Exception as e:
            logger.error(f"Error checking turn status: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    def complete_turn(self) -> dict:
        """
        Complete the current turn after PR is merged.

        This should be called by a webhook or after manually merging the PR.
        The game state will be updated by the GitHub Action.

        Returns:
            Status dict
        """
        if not self.state.current_turn:
            return {
                "success": False,
                "error": "No active turn to complete",
            }

        turn = self.state.current_turn

        # Record completed turn
        self.state.completed_turns.append({
            "tribe": turn.tribe.value,
            "session_id": turn.session_id,
            "pr_url": turn.pr_url,
            "started_at": turn.started_at,
            "completed_at": time.time(),
        })

        # Clear current turn
        self.state.current_turn = None
        self.state.is_running = False
        self._save_orchestrator_state()

        logger.info(f"Turn completed and recorded for {turn.tribe.value}")

        return {
            "success": True,
            "message": f"Turn completed for {turn.tribe.value}",
            "next_action": "Start next turn or wait for PR merge",
        }

    def run_full_turn(self, timeout: int = 300, community_prompts: dict = None) -> dict:
        """
        Run a full turn for the current tribe.

        This is a blocking operation that:
        1. Creates a Jules session
        2. Waits for completion
        3. Returns the PR URL

        Args:
            timeout: Maximum time to wait in seconds
            community_prompts: Optional community suggestions

        Returns:
            Result dict with PR URL or error
        """
        # Start the turn
        start_result = self.start_turn(community_prompts)
        if not start_result.get("success"):
            return start_result

        session_id = start_result["session_id"]

        # Wait for completion
        logger.info(f"Waiting for Jules session {session_id} to complete...")
        status, result = self.jules.wait_for_completion(
            session_id,
            timeout=timeout,
            poll_interval=15,
        )

        if status == SessionStatus.COMPLETED:
            self.state.current_turn.status = "completed"
            self.state.current_turn.pr_url = result
            self._save_orchestrator_state()

            return {
                "success": True,
                "tribe": self.state.current_turn.tribe.value,
                "pr_url": result,
                "message": "PR created successfully. Merge to apply the move.",
            }
        else:
            self.state.current_turn.status = "failed"
            self.state.current_turn.error = result
            self._save_orchestrator_state()

            return {
                "success": False,
                "tribe": self.state.current_turn.tribe.value,
                "error": result,
            }


# CLI interface
if __name__ == "__main__":
    import argparse
    from dotenv import load_dotenv

    load_dotenv()

    parser = argparse.ArgumentParser(description="Jules Orchestrator for Git-vilization")
    parser.add_argument("command", choices=["status", "start", "check", "complete", "run"])
    parser.add_argument("--owner", default="example", help="GitHub owner")
    parser.add_argument("--repo", default="gitvilization", help="GitHub repo")
    parser.add_argument("--state", default="data/gamestate.json", help="Game state path")
    parser.add_argument("--timeout", type=int, default=300, help="Timeout for run command")

    args = parser.parse_args()

    orchestrator = JulesOrchestrator(
        game_state_path=args.state,
        github_owner=args.owner,
        github_repo=args.repo,
    )

    if args.command == "status":
        print(json.dumps(orchestrator.get_status(), indent=2))

    elif args.command == "start":
        result = orchestrator.start_turn()
        print(json.dumps(result, indent=2))

    elif args.command == "check":
        result = orchestrator.check_turn_status()
        print(json.dumps(result, indent=2))

    elif args.command == "complete":
        result = orchestrator.complete_turn()
        print(json.dumps(result, indent=2))

    elif args.command == "run":
        result = orchestrator.run_full_turn(timeout=args.timeout)
        print(json.dumps(result, indent=2))
