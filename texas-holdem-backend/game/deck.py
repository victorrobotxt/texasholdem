import random
from typing import List, Tuple
from .card import Card, Rank, Suit

class Deck:
    def __init__(self) -> None:
        self._cards: List[Card] = [
            Card(rank, suit) 
            for suit in Suit 
            for rank in Rank
        ]
        self.shuffle()

    def shuffle(self) -> None:
        random.shuffle(self._cards)

    def deal(self, amount: int = 1) -> List[Card]:
        """Deals n cards from top of deck."""
        if len(self._cards) < amount:
            raise ValueError("Not enough cards in deck")
        
        dealt = self._cards[:amount]
        del self._cards[:amount]
        return dealt
