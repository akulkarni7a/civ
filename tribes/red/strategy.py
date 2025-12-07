"""
Strategy file for RED Tribe.

Jules (or any AI agent) edits this file to make moves.
The get_action function is called each turn with the current game state.
"""


def get_action(gamestate: dict) -> dict:
    """
    Analyze the game state and return ONE action.
    """

    # Get my tribe's data
    my_tribe = "RED"
    my_gold = gamestate["tribes"][my_tribe]["gold"]
    my_units = [u for u in gamestate["units"] if u["tribe"] == my_tribe]
    my_buildings = [b for b in gamestate["buildings"] if b["tribe"] == my_tribe]
    my_castle = next((b for b in my_buildings if b["type"] == "CASTLE"), None)

    # --- Strategy Priorities ---

    # 1. Train a Worker. This is the top priority for the first turn.
    workers = [u for u in my_units if u["type"] == "WORKER"]
    if len(workers) == 0 and my_gold >= 25 and my_castle:
        # Check if the castle tile is occupied by another unit
        is_castle_occupied = any(u["position"] == my_castle["position"] for u in gamestate["units"])
        if not is_castle_occupied:
            return {
                "action": "TRAIN",
                "unit_type": "WORKER",
                "building_id": my_castle["id"]
            }

    # Fallback: If for some reason we can't train a worker (e.g. castle is blocked),
    # do a default move to prevent an error.
    # This shouldn't happen on turn 1 based on the current state.
    knight = next((u for u in my_units if u["type"] == "KNIGHT" and u["canAct"]), None)
    if knight:
        return {"action": "MOVE", "unit_id": knight["id"], "target": knight["position"]}

    # If no knight can act, we still must return an action.
    return {"action": "MOVE", "unit_id": my_units[0]["id"], "target": my_units[0]["position"]}
