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
        {"action": "TRAIN", "unit_type": "WORKER", "building_id": 1}

        HARVEST - Assign a worker to harvest a gold mine
        {"action": "HARVEST", "unit_id": 5, "mine_id": 2}

        SETTLE - Use a settler to expand territory
        {"action": "SETTLE", "unit_id": 7, "target": [5, 6]}
    """

    # Get my tribe's data
    my_tribe = "RED"
    my_gold = gamestate["tribes"][my_tribe]["gold"]
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]
    my_buildings = [b for b in gamestate["buildings"] if b["tribe"] == my_tribe]
    my_castle = next((b for b in my_buildings if b["type"] == "CASTLE"), None)

    # --- Strategy Priorities ---

    # 1. Train a Worker if we don't have one and can afford it.
    workers = [u for u in my_units if u["type"] == "WORKER"]
    if len(workers) == 0 and my_gold >= 25 and my_castle:
        # Check if the castle tile is occupied
        is_castle_occupied = any(u["position"] == my_castle["position"] for u in gamestate["units"])
        if not is_castle_occupied:
            return {
                "action": "TRAIN",
                "unit_type": "WORKER",
                "building_id": my_castle["id"]
            }

    # 2. If we have a knight that can act, move it to scout.
    knights = [u for u in my_units if u["type"] == "KNIGHT" and u["canAct"]]
    if knights:
        knight = knights[0]
        # Move towards the center of the map to find gold mines
        target_pos = [9, 9] # A central location
        current_pos = knight["position"]

        new_pos = list(current_pos)
        if target_pos[0] > new_pos[0]:
            new_pos[0] += 1
        elif target_pos[0] < new_pos[0]:
            new_pos[0] -= 1

        if target_pos[1] > new_pos[1]:
            new_pos[1] += 1
        elif target_pos[1] < new_pos[1]:
            new_pos[1] -= 1

        if new_pos != current_pos:
            return {
                "action": "MOVE",
                "unit_id": knight["id"],
                "target": new_pos
            }


    # 3. Fallback: If nothing else, do nothing for now.
    for unit in my_units:
        if unit["canAct"]:
             # Move randomly
            return {
                "action": "MOVE",
                "unit_id": unit["id"],
                "target": [unit["position"][0] + 1, unit["position"][1]]
            }

    # If absolutely no unit can act, the game should proceed.
    # But the function requires an action. Return a dummy move for the first unit.
    return {"action": "MOVE", "unit_id": my_units[0]["id"], "target": my_units[0]["position"]}
