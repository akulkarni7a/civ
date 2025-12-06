"""
Jules API client for Git-vilization.

This module handles communication with Google's Jules AI coding agent API
to generate tribe strategies during gameplay.
"""

import os
import time
import json
import requests
from typing import Optional
from dataclasses import dataclass
from enum import Enum


class SessionStatus(str, Enum):
    PENDING = "PENDING"
    PLANNING = "PLANNING"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclass
class JulesSession:
    """Represents an active Jules session."""
    session_id: str
    tribe: str
    status: SessionStatus
    created_at: float
    pr_url: Optional[str] = None
    error: Optional[str] = None


class JulesClient:
    """Client for interacting with the Jules API."""

    BASE_URL = "https://julius.googleapis.com/v1alpha"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("JULES_KEY")
        if not self.api_key:
            raise ValueError("Jules API key not provided. Set JULES_KEY environment variable.")

        self.headers = {
            "X-Goog-Api-Key": self.api_key,
            "Content-Type": "application/json",
        }

    def list_sources(self) -> list[dict]:
        """List available GitHub repositories connected to Jules."""
        response = requests.get(
            f"{self.BASE_URL}/sources",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json().get("sources", [])

    def create_session(
        self,
        prompt: str,
        source: str,
        branch: str = "main",
        title: str = "Git-vilization Strategy",
        auto_pr: bool = True,
        require_approval: bool = False,
    ) -> str:
        """
        Create a new Jules session to generate code.

        Args:
            prompt: The instruction for Jules
            source: GitHub source in format "sources/github/owner/repo"
            branch: Starting branch name
            title: Session title
            auto_pr: Whether to automatically create a PR
            require_approval: Whether to require plan approval

        Returns:
            Session ID
        """
        payload = {
            "prompt": prompt,
            "sourceContext": {
                "source": source,
                "githubRepoContext": {
                    "startingBranch": branch,
                },
            },
            "automationMode": "AUTO_CREATE_PR" if auto_pr else "MANUAL",
            "title": title,
            "requirePlanApproval": require_approval,
        }

        response = requests.post(
            f"{self.BASE_URL}/sessions",
            headers=self.headers,
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        # Session name is typically "sessions/SESSION_ID"
        session_name = data.get("name", "")
        session_id = session_name.split("/")[-1] if "/" in session_name else session_name

        return session_id

    def send_message(self, session_id: str, message: str) -> dict:
        """Send a follow-up message to an existing session."""
        response = requests.post(
            f"{self.BASE_URL}/sessions/{session_id}:sendMessage",
            headers=self.headers,
            json={"prompt": message},
        )
        response.raise_for_status()
        return response.json()

    def get_activities(self, session_id: str, page_size: int = 30) -> list[dict]:
        """Get activities (responses) from a session."""
        response = requests.get(
            f"{self.BASE_URL}/sessions/{session_id}/activities",
            headers=self.headers,
            params={"pageSize": page_size},
        )
        response.raise_for_status()
        return response.json().get("activities", [])

    def approve_plan(self, session_id: str) -> dict:
        """Approve a pending plan in a session."""
        response = requests.post(
            f"{self.BASE_URL}/sessions/{session_id}:approvePlan",
            headers=self.headers,
            json={},
        )
        response.raise_for_status()
        return response.json()

    def get_session_status(self, session_id: str) -> tuple[SessionStatus, Optional[str]]:
        """
        Get the current status of a session.

        Returns:
            Tuple of (status, pr_url or error message)
        """
        activities = self.get_activities(session_id)

        pr_url = None
        error = None

        for activity in activities:
            action_type = activity.get("actionType", "")

            if action_type == "sessionCompleted":
                # Check for PR in artifacts
                artifacts = activity.get("artifacts", {})
                change_set = artifacts.get("changeSet", {})
                pr_url = change_set.get("pullRequestUrl")
                return SessionStatus.COMPLETED, pr_url

            elif action_type == "sessionFailed":
                error = activity.get("content", "Unknown error")
                return SessionStatus.FAILED, error

            elif action_type == "planGenerated":
                return SessionStatus.PLANNING, None

            elif action_type == "progressUpdated":
                return SessionStatus.EXECUTING, None

        return SessionStatus.PENDING, None

    def wait_for_completion(
        self,
        session_id: str,
        timeout: int = 300,
        poll_interval: int = 10,
    ) -> tuple[SessionStatus, Optional[str]]:
        """
        Wait for a session to complete.

        Args:
            session_id: The session to wait for
            timeout: Maximum time to wait in seconds
            poll_interval: Time between status checks

        Returns:
            Tuple of (final_status, pr_url or error)
        """
        start_time = time.time()

        while time.time() - start_time < timeout:
            status, result = self.get_session_status(session_id)

            if status in [SessionStatus.COMPLETED, SessionStatus.FAILED]:
                return status, result

            time.sleep(poll_interval)

        return SessionStatus.FAILED, "Timeout waiting for session completion"


def create_tribe_prompt(tribe: str, game_state: dict, community_prompts: list[str] = None) -> str:
    """
    Create the prompt for Jules to generate a tribe's strategy.

    Args:
        tribe: The tribe color (RED, BLUE, GREEN, YELLOW)
        game_state: Current game state as dict
        community_prompts: Optional list of community strategy suggestions

    Returns:
        Formatted prompt string
    """
    # Extract relevant info for this tribe
    tribe_state = game_state.get("tribes", {}).get(tribe, {})
    current_turn = game_state.get("turn", 1)
    units = [u for u in game_state.get("units", []) if u.get("tribe") == tribe]
    buildings = [b for b in game_state.get("buildings", []) if b.get("tribe") == tribe]

    # Count enemy units and buildings
    enemy_units = [u for u in game_state.get("units", []) if u.get("tribe") != tribe]
    enemy_buildings = [b for b in game_state.get("buildings", []) if b.get("tribe") != tribe]

    prompt = f"""You are the AI commander for the {tribe} tribe in Git-vilization.

## Current Game State (Turn {current_turn})

### Your Resources
- Gold: {tribe_state.get('gold', 0)}
- Units: {len(units)} ({', '.join(u['type'] for u in units)})
- Buildings: {len(buildings)} ({', '.join(b['type'] for b in buildings)})

### Enemy Forces
- Enemy Units: {len(enemy_units)}
- Enemy Buildings: {len(enemy_buildings)}

### Full Game State
```json
{json.dumps(game_state, indent=2)}
```

## Your Task

Analyze the game state and implement a strategy in `tribes/{tribe.lower()}/strategy.py`.

The strategy must:
1. Return a SINGLE valid action from `get_action(state: GameState) -> Action`
2. Choose from: MOVE, ATTACK, BUILD, TRAIN, HARVEST, or SETTLE
3. Be strategically sound - consider defense, expansion, and offense

### Available Actions

```python
# Move a unit
Action(action=ActionType.MOVE, unit_id=0, target=(x, y))

# Attack an enemy
Action(action=ActionType.ATTACK, unit_id=0, target_id=enemy_unit_id)

# Build a structure (BARRACKS=100g, TOWER=75g, WALL=25g)
Action(action=ActionType.BUILD, building=BuildingType.BARRACKS, position=(x, y))

# Train a unit (WORKER=25g, SETTLER=50g, WARRIOR=30g, ARCHER=40g, KNIGHT=75g)
Action(action=ActionType.TRAIN, building_id=castle_id, unit_type=UnitType.WARRIOR)

# Harvest gold (worker must be at gold mine)
Action(action=ActionType.HARVEST, unit_id=worker_id, mine_id=mine_id)

# Expand territory (settler adjacent to your territory)
Action(action=ActionType.SETTLE, unit_id=settler_id, target=(x, y))
```

### Unit Stats
- WORKER: 25g, 0 strength, 2 movement (harvests gold)
- SETTLER: 50g, 0 strength, 2 movement (expands territory)
- WARRIOR: 30g, 3 strength, 2 movement
- ARCHER: 40g, 2 strength, 2 movement (ranged)
- KNIGHT: 75g, 6 strength, 3 movement

"""

    if community_prompts:
        prompt += "\n## Community Strategy Suggestions\n"
        for i, suggestion in enumerate(community_prompts, 1):
            prompt += f"{i}. {suggestion}\n"

    prompt += """
## Implementation

Edit `tribes/{tribe.lower()}/strategy.py` to implement your strategy.
The function signature is:

```python
def get_action(state: GameState) -> Action:
    # Your strategy here
    pass
```

Make ONE strategic move that advances your position!
"""

    return prompt


# Example usage
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    client = JulesClient()

    # List available sources
    print("Available sources:")
    for source in client.list_sources():
        print(f"  - {source.get('name')}")
