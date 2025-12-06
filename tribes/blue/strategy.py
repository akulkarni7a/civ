"""
Strategy file for BLUE Tribe.

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

    my_tribe = "BLUE"
    my_gold = gamestate["tribes"][my_tribe]["gold"]
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]
    my_buildings = [b for b in gamestate["buildings"] if b["tribe"] == my_tribe]
    my_castle = next((b for b in my_buildings if b["type"] == "CASTLE"), None)

    # Blue tribe strategy: Economic focus
    # 1. Train workers early
    # 2. Harvest gold
    # 3. Build up army later

    workers = [u for u in my_units if u["type"] == "WORKER"]
    knights = [u for u in my_units if u["type"] == "KNIGHT"]

    # Train workers if we have few
    if len(workers) < 2 and my_gold >= 25 and my_castle:
        units_at_castle = [u for u in gamestate["units"] if tuple(u["position"]) == tuple(my_castle["position"])]
        if len(units_at_castle) == 0:
            return {
                "action": "TRAIN",
                "unit_type": "WORKER",
                "building_id": my_castle["id"]
            }

    # Move knights toward center
    if knights:
        knight = knights[0]
        current = knight["position"]
        # Move toward center
        dq = 1 if 10 > current[0] else -1 if 10 < current[0] else 0
        dr = 1 if 10 > current[1] else -1 if 10 < current[1] else 0

        if dq != 0 or dr != 0:
            return {
                "action": "MOVE",
                "unit_id": knight["id"],
                "target": [current[0] + dq, current[1] + dr]
            }

    # Move any combat unit
    for unit in my_units:
        if unit["type"] in ["KNIGHT", "WARRIOR", "ARCHER"]:
            current = unit["position"]
            return {
                "action": "MOVE",
                "unit_id": unit["id"],
                "target": [current[0] - 1, current[1] + 1]
            }

    # Fallback
    if my_units:
        return {
            "action": "MOVE",
            "unit_id": my_units[0]["id"],
            "target": [my_units[0]["position"][0] - 1, my_units[0]["position"][1]]
        }

    return {"action": "MOVE", "unit_id": 2, "target": [18, 1]}
