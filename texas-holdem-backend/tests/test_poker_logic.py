import pytest
from game.card import Card, Rank, Suit
from game.deck import Deck
from game.hand_evaluator import evaluate_hand

def test_deck_integrity():
    d = Deck()
    assert len(d._cards) == 52
    # Test randomness implicitly by checking first card differs eventually? 
    # Better: check unique cards
    uniques = set((c.rank, c.suit) for c in d._cards)
    assert len(uniques) == 52

def test_evaluation_ordering():
    # Royal Flush
    royal = [Card(Rank.ACE, Suit.HEARTS), Card(Rank.KING, Suit.HEARTS), 
             Card(Rank.QUEEN, Suit.HEARTS), Card(Rank.JACK, Suit.HEARTS), 
             Card(Rank.TEN, Suit.HEARTS)]
    
    # Full House
    fh = [Card(Rank.TEN, Suit.CLUBS), Card(Rank.TEN, Suit.DIAMONDS), 
          Card(Rank.TEN, Suit.SPADES), Card(Rank.TWO, Suit.CLUBS), 
          Card(Rank.TWO, Suit.DIAMONDS)]
          
    score_royal, _ = evaluate_hand(royal)
    score_fh, _ = evaluate_hand(fh)
    
    assert score_royal == 9 # Straight Flush (Top category)
    assert score_fh == 7 # Full House
    assert score_royal > score_fh

def test_kicker_logic():
    # Pair of Aces, King Kicker
    h1 = [Card(Rank.ACE, Suit.HEARTS), Card(Rank.ACE, Suit.CLUBS),
          Card(Rank.KING, Suit.HEARTS), Card(Rank.TWO, Suit.CLUBS), Card(Rank.THREE, Suit.CLUBS)]
    
    # Pair of Aces, Queen Kicker
    h2 = [Card(Rank.ACE, Suit.DIAMONDS), Card(Rank.ACE, Suit.SPADES),
          Card(Rank.QUEEN, Suit.HEARTS), Card(Rank.TWO, Suit.DIAMONDS), Card(Rank.THREE, Suit.DIAMONDS)]
          
    s1, k1 = evaluate_hand(h1)
    s2, k2 = evaluate_hand(h2)
    
    assert s1 == s2 == 2 # One Pair
    assert k1 > k2 # King > Queen kicker