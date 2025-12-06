"""
Strategy file for YELLOW Tribe.

Jules (or any AI agent) edits this file to make moves.
"""


def get_action(gamestate: dict) -> dict:
    """
    Analyze the game state and return ONE action.

    Args:
        gamestate: The full game state dictionary

    Returns:
        An action dictionary with one of:
        - MOVE: {"action": "MOVE", "unit_id": X, "target": [q, r]}
        - ATTACK: {"action": "ATTACK", "unit_id": X, "target_id": Y}
        - BUILD: {"action": "BUILD", "building": "TYPE", "position": [q, r]}
        - TRAIN: {"action": "TRAIN", "unit_type": "TYPE", "building_id": X}
        - HARVEST: {"action": "HARVEST", "unit_id": X, "mine_id": Y}
        - SETTLE: {"action": "SETTLE", "unit_id": X, "target": [q, r]}
    """

    my_tribe = "YELLOW"
    my_gold = gamestate["tribes"][my_tribe]["gold"]
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]
    my_buildings = [b for b in gamestate["buildings"] if b["tribe"] == my_tribe]
    my_castle = next((b for b in my_buildings if b["type"] == "CASTLE"), None)

    # Yellow tribe strategy: Aggressive rush
    # 1. Train warriors immediately
    # 2. Rush toward nearest enemy
    # 3. Attack!

    knights = [u for u in my_units if u["type"] == "KNIGHT"]
    warriors = [u for u in my_units if u["type"] == "WARRIOR"]
    combat_units = knights + warriors

    # Find nearest enemy
    enemy_units = [u for u in gamestate["units"] if u["tribe"] != my_tribe]

    # Train warriors aggressively
    if my_gold >= 30 and my_castle:
        units_at_castle = [u for u in gamestate["units"] if tuple(u["position"]) == tuple(my_castle["position"])]
        if len(units_at_castle) == 0:
            return {
                "action": "TRAIN",
                "unit_type": "WARRIOR",
                "building_id": my_castle["id"]
            }

    # Attack if adjacent to enemy
    for unit in combat_units:
        for enemy in enemy_units:
            # Check if adjacent (distance 1)
            dx = abs(unit["position"][0] - enemy["position"][0])
            dy = abs(unit["position"][1] - enemy["position"][1])
            if dx <= 1 and dy <= 1 and (dx + dy) > 0:
                return {
                    "action": "ATTACK",
                    "unit_id": unit["id"],
                    "target_id": enemy["id"]
                }

    # Move toward nearest enemy
    if combat_units and enemy_units:
        unit = combat_units[0]
        # Find closest enemy
        closest = min(enemy_units, key=lambda e:
            abs(e["position"][0] - unit["position"][0]) +
            abs(e["position"][1] - unit["position"][1])
        )

        current = unit["position"]
        target_pos = closest["position"]

        dq = 1 if target_pos[0] > current[0] else -1 if target_pos[0] < current[0] else 0
        dr = 1 if target_pos[1] > current[1] else -1 if target_pos[1] < current[1] else 0

        if dq != 0 or dr != 0:
            return {
                "action": "MOVE",
                "unit_id": unit["id"],
                "target": [current[0] + dq, current[1] + dr]
            }

    # Fallback: move toward center
    if my_units:
        unit = my_units[0]
        current = unit["position"]
        return {
            "action": "MOVE",
            "unit_id": unit["id"],
            "target": [current[0] - 1, current[1] - 1]
        }

    return {"action": "MOVE", "unit_id": 4, "target": [17, 17]}
