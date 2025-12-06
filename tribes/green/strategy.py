"""
Strategy file for GREEN Tribe.

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

    my_tribe = "GREEN"
    my_gold = gamestate["tribes"][my_tribe]["gold"]
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]
    my_buildings = [b for b in gamestate["buildings"] if b["tribe"] == my_tribe]
    my_castle = next((b for b in my_buildings if b["type"] == "CASTLE"), None)

    # Green tribe strategy: Defensive expansion
    # 1. Train settlers
    # 2. Expand territory
    # 3. Build defensive structures

    knights = [u for u in my_units if u["type"] == "KNIGHT"]
    settlers = [u for u in my_units if u["type"] == "SETTLER"]

    # Train a settler if we have gold
    if len(settlers) == 0 and my_gold >= 50 and my_castle:
        units_at_castle = [u for u in gamestate["units"] if tuple(u["position"]) == tuple(my_castle["position"])]
        if len(units_at_castle) == 0:
            return {
                "action": "TRAIN",
                "unit_type": "SETTLER",
                "building_id": my_castle["id"]
            }

    # Move knights
    if knights:
        knight = knights[0]
        current = knight["position"]
        # Move toward center-right
        dq = 1 if 10 > current[0] else 0
        dr = -1 if 10 < current[1] else 0

        if dq != 0 or dr != 0:
            return {
                "action": "MOVE",
                "unit_id": knight["id"],
                "target": [current[0] + dq, current[1] + dr]
            }

    # Move any unit toward center
    for unit in my_units:
        if unit["type"] != "WORKER":
            current = unit["position"]
            dq = 1 if 10 > current[0] else -1 if 10 < current[0] else 0
            dr = -1 if 10 < current[1] else 1 if 10 > current[1] else 0

            if dq != 0 or dr != 0:
                return {
                    "action": "MOVE",
                    "unit_id": unit["id"],
                    "target": [current[0] + dq, current[1] + dr]
                }

    # Fallback
    if my_units:
        unit = my_units[0]
        return {
            "action": "MOVE",
            "unit_id": unit["id"],
            "target": [unit["position"][0] + 1, unit["position"][1] - 1]
        }

    return {"action": "MOVE", "unit_id": 3, "target": [1, 17]}
