import os
import json
import logging
from typing import Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed

load_dotenv()

logger = logging.getLogger('poker.ai')

API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("models/gemini-flash-latest")
else:
    model = None


def _get_position_name(player_id: int, dealer_id: int, num_players: int) -> str:
    relative_pos = (player_id - dealer_id) % num_players
    if relative_pos == 1:
        return "Small Blind (early)"
    elif relative_pos == 2:
        return "Big Blind (early)"
    elif relative_pos == 3:
        return "Under the Gun (early)"
    elif relative_pos >= num_players - 1:
        return "Button (late - best position)"
    else:
        return "Middle position"


def _calculate_pot_odds(pot: int, to_call: int) -> str:
    if to_call <= 0:
        return "N/A (no call required)"
    total_pot = pot + to_call
    ratio = total_pot / to_call
    return f"{ratio:.1f}:1 (need {100/ratio:.0f}% equity to call)"


def _summarize_opponents(players: list, my_id: int) -> str:
    lines = []
    for p in players:
        if p['id'] == my_id:
            continue
        status = "folded" if p['isFolded'] else f"${p['chips']} chips, bet ${p['currentBet']}"
        action = f" - last: {p['lastAction']}" if p.get('lastAction') else ""
        lines.append(f"  - {p['name']}: {status}{action}")
    return "\n".join(lines)


@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def get_ai_decision(game_state: Dict[str, Any], player_id: int) -> Dict[str, Any]:
    if not model:
        return _fallback_logic(game_state, player_id)

    my_player = next((p for p in game_state['players'] if p['id'] == player_id), None)
    if not my_player:
        return {"action": "fold", "amount": 0}

    to_call = game_state['betToCall'] - my_player['currentBet']
    position = _get_position_name(player_id, game_state['dealerId'], len(game_state['players']))
    pot_odds = _calculate_pot_odds(game_state['pot'], to_call)
    opponents = _summarize_opponents(game_state['players'], player_id)

    prompt = f"""You are a skilled Poker AI playing Texas Hold'em. Make strategic decisions.

YOUR SITUATION:
- Name: {my_player.get('name', f'Player {player_id}')}
- Position: {position}
- Chips: ${my_player['chips']}
- Your Hand: {my_player['hand']}
- Your Current Bet: ${my_player['currentBet']}

TABLE STATE:
- Stage: {game_state['stage']}
- Community Cards: {game_state['communityCards'] or 'None yet'}
- Pot: ${game_state['pot']}
- Amount to Call: ${to_call}
- Pot Odds: {pot_odds}

OPPONENTS:
{opponents}

STRATEGY TIPS:
- Late position (Button) allows you to play more hands
- Early position requires stronger hands
- Pot odds help determine if calling is profitable
- Consider opponent tendencies based on their last actions
- Mix up your play to avoid being predictable

VALID ACTIONS:
- "fold": Give up your hand
- "check": Pass if no bet to call (to_call = 0)
- "call": Match the current bet
- "raise": Increase the bet (specify amount as total bet size)

Respond with ONLY valid JSON: {{"action": "string", "amount": integer}}
For raise, amount should be the TOTAL bet (e.g., if current bet is 20, raise to 50 means amount: 50)"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        text = text.strip()

        decision = json.loads(text)

        if decision['action'] not in ['fold', 'check', 'call', 'bet', 'raise']:
            raise ValueError("Invalid Action")

        logger.debug(f"AI decision for player {player_id}: {decision}")
        return decision
    except Exception as e:
        logger.warning(f"AI Error for player {player_id}: {e}")
        return _fallback_logic(game_state, player_id)


def _fallback_logic(game_state: dict, player_id: int) -> dict:
    p_list = game_state.get('players', [])
    p = next((x for x in p_list if x['id'] == player_id), None)
    if not p:
        return {"action": "fold", "amount": 0}

    to_call = game_state['betToCall'] - p['currentBet']

    if to_call == 0:
        return {"action": "check", "amount": 0}
    if to_call < (p['chips'] / 10):
        return {"action": "call", "amount": 0}

    return {"action": "fold", "amount": 0}
