import os
import json
import logging
import re
import random
from typing import Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed

load_dotenv()

logger = logging.getLogger('poker.ai')

API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("models/gemini-2.0-flash")
else:
    model = None

PERSONALITIES = {
    "Viper": "You are a Loose-Aggressive maniac. You love to bluff and put pressure on opponents. You rarely fold pre-flop. You want to dominate the table.",
    "Mountain": "You are a 'Calling Station'. You hate folding. You want to see the flop. If you have any piece of the board, you call. You are stubborn.",
    "Shark": "You are a Tricky/Deceptive pro. You mix up your play. Sometimes you trap, sometimes you overbet. You attack weakness.",
    "default": "You are an Action Player. You prioritize fun and aggressive play over safety. Do not fold too easily."
}

def _get_position_name(player_id: int, dealer_id: int, num_players: int) -> str:
    relative_pos = (player_id - dealer_id) % num_players
    if relative_pos == 1: return "Small Blind (early)"
    elif relative_pos == 2: return "Big Blind (early)"
    elif relative_pos == 3: return "Under the Gun (early)"
    elif relative_pos >= num_players - 1: return "Button (late)"
    else: return "Middle position"

def _calculate_pot_odds(pot: int, to_call: int) -> str:
    if to_call <= 0: return "N/A"
    total_pot = pot + to_call
    ratio = total_pot / to_call
    return f"{ratio:.1f}:1"

def _summarize_opponents(players: list, my_id: int) -> str:
    lines = []
    for p in players:
        if p['id'] == my_id: continue
        status = "folded" if p['isFolded'] else f"${p['chips']} chips, bet ${p['currentBet']}"
        action = f" - last: {p['lastAction']}" if p.get('lastAction') else ""
        lines.append(f"  - {p['name']}: {status}{action}")
    return "\n".join(lines)

@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def get_ai_decision(game_state: Dict[str, Any], player_id: int) -> Dict[str, Any]:
    if not model:
        return _fallback_logic(game_state, player_id)

    my_player = next((p for p in game_state['players'] if p['id'] == player_id), None)
    if not my_player: return {"action": "fold", "amount": 0}

    persona_text = PERSONALITIES.get(my_player.get('name'), PERSONALITIES["default"])

    to_call = game_state['betToCall'] - my_player['currentBet']
    pot_odds = _calculate_pot_odds(game_state['pot'], to_call)
    opponents = _summarize_opponents(game_state['players'], player_id)

    prompt = f"""You are playing Texas Hold'em. 
IDENTITY: {persona_text}

YOUR STATE:
- Name: {my_player.get('name')}
- Chips: ${my_player['chips']}
- Hand: {my_player['hand']}
- Current Bet: ${my_player['currentBet']}

TABLE:
- Stage: {game_state['stage']}
- Board: {game_state['communityCards'] or 'None'}
- Pot: ${game_state['pot']}
- To Call: ${to_call}
- Pot Odds: {pot_odds}

OPPONENTS:
{opponents}

INSTRUCTIONS:
1. DO NOT BE BORING. DO NOT FOLD EVERYTHING.
2. If you have ANY pair or ANY draw, stay in the hand.
3. If you have nothing but the pot is big, consider a bluff.
4. If checking is free, ALWAYS CHECK (never fold if to_call is 0).

Respond with JSON ONLY: {{"action": "string", "amount": integer}}
Valid actions: fold, check, call, raise.
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if json_match:
            clean_json = json_match.group(1)
        else:
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                clean_json = text[start_idx : end_idx + 1]
            else:
                clean_json = text

        decision = json.loads(clean_json)
        
        if decision['action'] == 'fold' and to_call == 0:
            decision['action'] = 'check'

        if decision['action'] not in ['fold', 'check', 'call', 'bet', 'raise']:
            raise ValueError("Invalid Action")

        logger.info(f"[{game_state['gameId'][:8]}] AI {my_player['name']}: {decision['action']} {decision.get('amount', '')}")
        return decision
    except Exception as e:
        logger.warning(f"AI Error for {player_id}: {e}")
        return _fallback_logic(game_state, player_id)

def _fallback_logic(game_state: dict, player_id: int) -> dict:
    p_list = game_state.get('players', [])
    p = next((x for x in p_list if x['id'] == player_id), None)
    if not p: return {"action": "fold", "amount": 0}

    to_call = game_state['betToCall'] - p['currentBet']

    if to_call == 0:
        return {"action": "check", "amount": 0}
    
    if to_call < (p['chips'] / 4):
        if random.random() < 0.1 and p['chips'] > to_call * 2:
             return {"action": "raise", "amount": p['currentBet'] + to_call + 20}
        return {"action": "call", "amount": 0}

    return {"action": "fold", "amount": 0}
