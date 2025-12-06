"""
Strategy file for RED Tribe.

Jules (or any AI agent) edits this file to make moves.
The get_action function is called each turn with the current game state.
"""


def get_action(gamestate: dict) -> dict:
    """
    Analyze the game state and return ONE action.

    Args:
        gamestate: The full game state dictionary containing:
            - gameId: Unique game identifier
            - turn: Current turn number
            - currentTribe: Which tribe's turn it is
            - status: LOBBY, IN_PROGRESS, or FINISHED
            - map: {width, height, tiles: [{q, r, terrain, owner}]}
            - tribes: {RED/BLUE/GREEN/YELLOW: {gold, alive}}
            - units: [{id, tribe, type, position, canAct, harvesting?}]
            - buildings: [{id, tribe, type, position, hp}]
            - goldMines: [{id, position, workerId}]
            - history: [{turn, tribe, action, details}]

    Returns:
        An action dictionary. Valid actions:

        MOVE - Move a unit to a new position
        {"action": "MOVE", "unit_id": 1, "target": [4, 5]}

        ATTACK - Attack an enemy unit
        {"action": "ATTACK", "unit_id": 1, "target_id": 8}

        BUILD - Construct a building (BARRACKS, TOWER, WALL)
        {"action": "BUILD", "building": "BARRACKS", "position": [3, 3]}

        TRAIN - Train a unit at a building (WORKER, SETTLER, WARRIOR, ARCHER, KNIGHT)
        {"action": "TRAIN", "unit_type": "WARRIOR", "building_id": 1}

        HARVEST - Assign a worker to harvest a gold mine
        {"action": "HARVEST", "unit_id": 5, "mine_id": 2}

        SETTLE - Use a settler to expand territory
        {"action": "SETTLE", "unit_id": 7, "target": [5, 6]}
    """

    # Get my tribe's data
    my_tribe = "RED"
    my_gold = gamestate["tribes"][my_tribe]["gold"]

    # Get my units
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]
    my_buildings = [b for b in gamestate["buildings"] if b["tribe"] == my_tribe]

    # Find my castle
    my_castle = next((b for b in my_buildings if b["type"] == "CASTLE"), None)

    # Strategy: Simple aggressive approach
    # 1. If we have gold and no workers, train a worker
    # 2. If we have a worker not harvesting, send to nearest mine
    # 3. Otherwise, move knight toward enemies

    # Check if we have workers
    workers = [u for u in my_units if u["type"] == "WORKER"]
    knights = [u for u in my_units if u["type"] == "KNIGHT"]

    # If no workers and have gold, train one
    if len(workers) == 0 and my_gold >= 25 and my_castle:
        # Check if castle position is free
        units_at_castle = [u for u in gamestate["units"] if u["position"] == my_castle["position"]]
        if len(units_at_castle) == 0:
            return {
                "action": "TRAIN",
                "unit_type": "WORKER",
                "building_id": my_castle["id"]
            }

    # If we have knights, move one toward the center
    if knights:
        knight = knights[0]
        current_pos = knight["position"]
        target = [10, 10]  # Center of map

        # Simple movement toward center
        new_q = current_pos[0] + (1 if target[0] > current_pos[0] else -1 if target[0] < current_pos[0] else 0)
        new_r = current_pos[1] + (1 if target[1] > current_pos[1] else -1 if target[1] < current_pos[1] else 0)

        # Check if the move is valid (not moving to same position)
        if [new_q, new_r] != current_pos:
            return {
                "action": "MOVE",
                "unit_id": knight["id"],
                "target": [new_q, new_r]
            }

    # Default: train a warrior if we can
    if my_gold >= 30 and my_castle:
        units_at_castle = [u for u in gamestate["units"] if u["position"] == my_castle["position"]]
        if len(units_at_castle) == 0:
            return {
                "action": "TRAIN",
                "unit_type": "WARRIOR",
                "building_id": my_castle["id"]
            }

    # If nothing else, try to move any unit
    for unit in my_units:
        if unit["type"] in ["KNIGHT", "WARRIOR"]:
            current_pos = unit["position"]
            # Move toward center
            new_q = current_pos[0] + (1 if 10 > current_pos[0] else -1 if 10 < current_pos[0] else 0)
            new_r = current_pos[1] + (1 if 10 > current_pos[1] else -1 if 10 < current_pos[1] else 0)
            if [new_q, new_r] != current_pos:
                return {
                    "action": "MOVE",
                    "unit_id": unit["id"],
                    "target": [new_q, new_r]
                }

    # Fallback: just return a move for the first unit
    if my_units:
        unit = my_units[0]
        return {
            "action": "MOVE",
            "unit_id": unit["id"],
            "target": [unit["position"][0] + 1, unit["position"][1]]
        }

    # Should never reach here
    return {"action": "MOVE", "unit_id": 1, "target": [1, 1]}
