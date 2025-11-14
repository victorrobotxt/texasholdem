from enum import IntEnum
from functools import total_ordering

class Suit(IntEnum):
    SPADES = 1
    HEARTS = 2
    DIAMONDS = 3
    CLUBS = 4

class Rank(IntEnum):
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8
    NINE = 9
    TEN = 10
    JACK = 11
    QUEEN = 12
    KING = 13
    ACE = 14

@total_ordering
class Card:
    """Represents a standard playing card."""

    def __init__(self, rank: Rank, suit: Suit):
        self.rank = rank
        self.suit = suit

    def __repr__(self) -> str:
        return f"{self.rank.name.capitalize()} of {self.suit.name.capitalize()}"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Card):
            return NotImplemented
        return self.rank == other.rank and self.suit == other.suit

    def __lt__(self, other: object) -> bool:
        if not isinstance(other, Card):
            return NotImplemented
        return self.rank < other.rank

    def to_str(self) -> str:
        """Returns short string format, e.g. 'AS', 'TH'."""
        rank_char = str(self.rank.value)
        if self.rank.value == 10:
            rank_char = 'T'
        elif self.rank == Rank.JACK:
            rank_char = 'J'
        elif self.rank == Rank.QUEEN:
            rank_char = 'Q'
        elif self.rank == Rank.KING:
            rank_char = 'K'
        elif self.rank == Rank.ACE:
            rank_char = 'A'

        return f"{rank_char}{self.suit.name[0]}"
