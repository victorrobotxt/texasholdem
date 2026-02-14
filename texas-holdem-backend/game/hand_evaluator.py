from collections import Counter
from typing import List, Tuple, Union
from .card import Card, Rank

def evaluate_hand(cards: List[Card]) -> Tuple[int, List[int]]:
    """
    Calculates the strength of a 5-7 card hand.
    Returns (Score, [Kickers]) for easy tuple comparison.
    """
    if not cards or len(cards) < 5:
        return (0, [])

    sorted_cards = sorted(cards, key=lambda c: c.rank, reverse=True)
    
    suit_counts = Counter(c.suit for c in sorted_cards)
    flush_suit = next((s for s, c in suit_counts.items() if c >= 5), None)
    
    flush_cards = []
    if flush_suit:
        flush_cards = [c for c in sorted_cards if c.suit == flush_suit]

    def get_straight(candidates: List[Card]) -> Union[List[int], None]:
        unique_ranks = sorted(list(set(c.rank.value for c in candidates)), reverse=True)
        
        for i in range(len(unique_ranks) - 4):
            window = unique_ranks[i:i+5]
            if window[0] - window[4] == 4:
                return window
        
        if {14, 2, 3, 4, 5}.issubset(set(unique_ranks)):
            return [5, 4, 3, 2, 14] # 5-high straight
            
        return None

    if flush_suit:
        sf_ranks = get_straight(flush_cards)
        if sf_ranks:
            return (9, sf_ranks)

    rank_counts = Counter(c.rank.value for c in sorted_cards)
    quads = [r for r, count in rank_counts.items() if count == 4]
    if quads:
        kicker = max([r for r in rank_counts if r != quads[0]])
        return (8, [quads[0], kicker])

    trips = [r for r, count in rank_counts.items() if count == 3]
    pairs = [r for r, count in rank_counts.items() if count == 2]
    
    if trips:
        top_trip = trips[0]
        remaining_trips = [t for t in trips if t != top_trip]
        all_pairs = sorted(pairs + remaining_trips, reverse=True)
        
        if all_pairs:
            return (7, [top_trip, all_pairs[0]])

    if flush_suit:
        return (6, [c.rank.value for c in flush_cards[:5]])

    straight_ranks = get_straight(sorted_cards)
    if straight_ranks:
        return (5, straight_ranks)

    if trips:
        kickers = sorted([r for r in rank_counts if r != trips[0]], reverse=True)[:2]
        return (4, [trips[0]] + kickers)

    if len(pairs) >= 2:
        top_pairs = pairs[:2]
        kicker = max([r for r in rank_counts if r not in top_pairs])
        return (3, top_pairs + [kicker])

    if pairs:
        kickers = sorted([r for r in rank_counts if r != pairs[0]], reverse=True)[:3]
        return (2, [pairs[0]] + kickers)

    return (1, [c.rank.value for c in sorted_cards[:5]])
