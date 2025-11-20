import os
import json
from typing import Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed

load_dotenv()

# Safe initialization
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("models/gemini-flash-latest")
else:
    model = None

@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def get_ai_decision(game_state: Dict[str, Any], player_id: int) -> Dict[str, Any]:
    """
    Queries Gemini API for a poker decision.
    Returns a dict with keys: action (str), amount (int).
    """
    if not model:
        return _fallback_logic(game_state, player_id)

    # Locate self
    my_player = next((p for p in game_state['players'] if p['id'] == player_id), None)
    if not my_player:
        return {"action": "fold", "amount": 0}

    # Construct context
    prompt = f"""
    You are a Poker AI (Player {player_id}).
    Chips: {my_player['chips']}, Bet in front: {my_player['currentBet']}.
    Hand: {my_player['hand']}
    Community Cards: {game_state['communityCards']}
    Pot: {game_state['pot']}
    Amount needed to call: {game_state['betToCall'] - my_player['currentBet']}
    Stage: {game_state['stage']}

    Valid Actions: 'fold', 'check', 'call', 'raise'.
    If checking is possible (to_call == 0), prefer check over call 0.

    Output ONLY JSON: {{"action": "string", "amount": integer}}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Sanitization for common Markdown wrappers
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]

        decision = json.loads(text)

        # Validation
        if decision['action'] not in ['fold', 'check', 'call', 'bet', 'raise']:
            raise ValueError("Invalid Action")

        return decision
    except Exception as e: # pylint: disable=broad-except
        print(f"AI Error: {e}")
        return _fallback_logic(game_state, player_id)

def _fallback_logic(game_state: dict, player_id: int) -> dict:
    """Simple rule-based fallback if AI fails."""
    p_list = game_state.get('players', [])
    # Find player by ID
    p = next((x for x in p_list if x['id'] == player_id), None)
    if not p:
        return {"action": "fold", "amount": 0}

    to_call = game_state['betToCall'] - p['currentBet']

    if to_call == 0:
        return {"action": "check", "amount": 0}
    if to_call < (p['chips'] / 10):
        return {"action": "call", "amount": 0}

    return {"action": "fold", "amount": 0}
