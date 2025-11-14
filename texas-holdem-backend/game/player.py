from dataclasses import dataclass, field
from typing import List, Optional
from .card import Card

@dataclass
class Player:
    id: int
    name: str  # FIXED: 'string' is a module, 'str' is the type
    chips: int
    is_human: bool = False
    hand: List[Card] = field(default_factory=list)
    current_bet: int = 0
    is_folded: bool = False
    is_all_in: bool = False
    last_action: Optional[str] = None

    def bet(self, amount: int) -> int:
        """
        Deducts chips and adds to current bet.
        Returns the actual amount added (handling all-in scenarios).
        """
        actual_bet = min(self.chips, amount)
        self.chips -= actual_bet
        self.current_bet += actual_bet

        if self.chips == 0:
            self.is_all_in = True

        return actual_bet

    def fold(self) -> None:
        self.is_folded = True
        self.last_action = "Fold"

    def reset_round_state(self) -> None:
        self.current_bet = 0
        self.last_action = None

    def reset_hand_state(self) -> None:
        self.hand = []
        self.current_bet = 0
        self.is_folded = False
        self.is_all_in = False
        self.last_action = None

    def to_dict(self, show_hand: bool = False) -> dict:
        """Serialization helper."""
        hand_display = []
        if show_hand:
            hand_display = [c.to_str() for c in self.hand]
        elif self.hand:
            hand_display = ["BACK", "BACK"]

        return {
            "id": self.id,
            "name": self.name,
            "chips": self.chips,
            "hand": hand_display,
            "currentBet": self.current_bet,
            "isFolded": self.is_folded,
            "isAllIn": self.is_all_in,
            "isHuman": self.is_human,
            "lastAction": self.last_action
        }
