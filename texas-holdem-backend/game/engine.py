import uuid
import threading
from typing import List, Dict, Any
from .card import Card
from .deck import Deck
from .player import Player
from .hand_evaluator import evaluate_hand

class GameEngine:
    def __init__(self, players: List[Player]):
        self.id = str(uuid.uuid4())
        self.lock = threading.RLock()
        self.players = players
        self.deck = Deck()
        self.community_cards: List[Card] = []
        self.pot = 0

        self.dealer_pos = 0
        self.active_player_id = 0
        self.bet_to_call = 0
        self.stage = "PRE_FLOP"
        self.winners: List[int] = []

        self.start_new_hand()

    def start_new_hand(self) -> None:
        self.deck = Deck()
        self.community_cards = []
        self.pot = 0
        self.winners = []
        self.stage = "PRE_FLOP"

        self.dealer_pos = (self.dealer_pos + 1) % len(self.players)

        active_count = 0
        for p in self.players:
            p.reset_hand_state()
            if p.chips > 0:
                p.hand = self.deck.deal(2)
                active_count += 1
            else:
                p.is_folded = True

        if active_count < 2:
            pass

        sb_pos = (self.dealer_pos + 1) % len(self.players)
        bb_pos = (self.dealer_pos + 2) % len(self.players)

        self._post_blind(sb_pos, 10)
        self._post_blind(bb_pos, 20)
        self.bet_to_call = 20

        self.active_player_id = (bb_pos + 1) % len(self.players)

    def _post_blind(self, player_idx: int, amount: int) -> None:
        player = self.players[player_idx]
        if player.chips > 0:
            bet = player.bet(amount)
            self.pot += bet
            player.last_action = "Blind"

    def process_player_action(self, player_id: int, action: str, amount: int = 0) -> None:
        if player_id != self.active_player_id:
            raise ValueError("Not this player's turn")

        player = self.players[player_id]

        if action == "fold":
            player.fold()

        elif action in ["check", "call"]:
            call_amt = self.bet_to_call - player.current_bet
            if call_amt > 0:
                added = player.bet(call_amt)
                self.pot += added
                player.last_action = "Call"
            else:
                player.last_action = "Check"

        elif action in ["bet", "raise"]:
            diff = amount - player.current_bet
            added = player.bet(diff)
            self.pot += added

            if player.current_bet > self.bet_to_call:
                self.bet_to_call = player.current_bet
                player.last_action = f"Raise ${player.current_bet}"
            else:
                player.last_action = "All In"

        self._rotate_turn()

    def _rotate_turn(self) -> None:
        active_players = [p for p in self.players if not p.is_folded and not p.is_all_in]

        if len([p for p in self.players if not p.is_folded]) == 1:
            self._end_hand_prematurely()
            return

        next_idx = self.active_player_id
        for i in range(1, len(self.players)):
            idx = (self.active_player_id + i) % len(self.players)
            p = self.players[idx]
            if not p.is_folded and not p.is_all_in:
                next_idx = idx
                break
        
        all_matched = all(
            p.current_bet == self.bet_to_call or p.is_all_in 
            for p in active_players
        )
        
        all_acted = all(p.last_action is not None for p in active_players)
        
        round_over = False
        if all_matched and all_acted:
            is_preflop = (self.stage == "PRE_FLOP")
            bb_pos = (self.dealer_pos + 2) % len(self.players)
            bb_player = self.players[bb_pos]
            
            if is_preflop and self.bet_to_call == 20 and bb_player.last_action == "Blind":
                if next_idx != bb_pos:
                    pass
                round_over = False
            else:
                round_over = True

        if round_over:
            self._advance_stage()
        else:
            self.active_player_id = next_idx

    def _advance_stage(self) -> None:
        for p in self.players:
            p.reset_round_state()
        self.bet_to_call = 0

        if self.stage == "PRE_FLOP":
            self.stage = "FLOP"
            self.community_cards.extend(self.deck.deal(3))
        elif self.stage == "FLOP":
            self.stage = "TURN"
            self.community_cards.extend(self.deck.deal(1))
        elif self.stage == "TURN":
            self.stage = "RIVER"
            self.community_cards.extend(self.deck.deal(1))
        elif self.stage == "RIVER":
            self._resolve_showdown()
            return

        idx = self.dealer_pos
        for i in range(1, len(self.players) + 1):
            next_idx = (idx + i) % len(self.players)
            p = self.players[next_idx]
            if not p.is_folded and not p.is_all_in:
                self.active_player_id = next_idx
                return

        if self.stage != "HAND_OVER":
            self._advance_stage()

    def _resolve_showdown(self) -> None:
        self.stage = "SHOWDOWN"
        self.active_player_id = -1

        remaining = [p for p in self.players if not p.is_folded]

        results = []
        for p in remaining:
            score_tuple = evaluate_hand(p.hand + self.community_cards)
            results.append((p, score_tuple))

        if not results:
            return

        best_score = max(results, key=lambda x: x[1])[1]
        winners = [p for p, score in results if score == best_score]

        self.winners = [p.id for p in winners]

        if winners:
            share = self.pot // len(winners)
            for p in winners:
                p.chips += share

        self.stage = "HAND_OVER"

    def _end_hand_prematurely(self) -> None:
        """Everyone folded except one."""
        winner = next(p for p in self.players if not p.is_folded)
        winner.chips += self.pot
        self.winners = [winner.id]
        self.stage = "HAND_OVER"
        self.active_player_id = -1

    def to_dict(self, for_player_id: int) -> Dict[str, Any]:
        return {
            "gameId": self.id,
            "pot": self.pot,
            "communityCards": [c.to_str() for c in self.community_cards],
            "activePlayerId": self.active_player_id,
            "dealerId": self.dealer_pos,
            "smallBlindPlayerId": (self.dealer_pos + 1) % len(self.players),
            "bigBlindPlayerId": (self.dealer_pos + 2) % len(self.players),
            "stage": self.stage,
            "betToCall": self.bet_to_call,
            "winners": self.winners,
            "players": [
                p.to_dict(show_hand=(p.id == for_player_id or self.stage == "SHOWDOWN"))
                for p in self.players
            ]
        }
