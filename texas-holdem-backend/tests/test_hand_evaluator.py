import unittest
from typing import List
from game.hand_evaluator import evaluate_hand
from game.card import Card, Rank, Suit

class TestHandEvaluator(unittest.TestCase):

    def _create_cards_from_strings(self, card_strs: List[str]) -> List[Card]:
        """Helper to make cards from 'AS', 'KH' etc."""
        cards = []
        rank_map = {'A': Rank.ACE, 'K': Rank.KING, 'Q': Rank.QUEEN, 'J': Rank.JACK, 'T': Rank.TEN,
                    '9': Rank.NINE, '8': Rank.EIGHT, '7': Rank.SEVEN, '6': Rank.SIX, '5': Rank.FIVE,
                    '4': Rank.FOUR, '3': Rank.THREE, '2': Rank.TWO}
        suit_map = {'S': Suit.SPADES, 'H': Suit.HEARTS, 'D': Suit.DIAMONDS, 'C': Suit.CLUBS}
        
        for s in card_strs:
            rank = rank_map[s[0]]
            suit = suit_map[s[1]]
            cards.append(Card(rank, suit))
        return cards

    def test_royal_flush(self):
        cards = self._create_cards_from_strings(['AS', 'KS', 'QS', 'JS', 'TS', '3D', '4C'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 9) # 9 = Straight Flush / Royal

    def test_four_of_a_kind(self):
        cards = self._create_cards_from_strings(['AC', 'AD', 'AS', 'AH', 'KH', 'QD', 'JC'])
        rank, kickers = evaluate_hand(cards)
        self.assertEqual(rank, 8) # 8 = Four of a Kind
        self.assertEqual(kickers[1], 13) 

    def test_full_house(self):
        cards = self._create_cards_from_strings(['KC', 'KD', 'KS', 'QH', 'QD', 'JC', '2S'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 7) # 7 = Full House

    def test_flush(self):
        cards = self._create_cards_from_strings(['KH', 'QH', '7H', '5H', '2H', 'AD', 'AC'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 6) # 6 = Flush

    def test_straight(self):
        cards = self._create_cards_from_strings(['TC', '9D', '8S', '7H', '6C', 'AD', '2S'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 5) # 5 = Straight

    def test_three_of_a_kind(self):
        cards = self._create_cards_from_strings(['QC', 'QD', 'QS', 'KH', 'JD', '7C', '5S'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 4) # 4 = Set

    def test_two_pair(self):
        cards = self._create_cards_from_strings(['KC', 'KD', 'JS', 'JH', 'AD', '7C', '5S'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 3) # 3 = Two Pair

    def test_one_pair(self):
        cards = self._create_cards_from_strings(['AC', 'AD', 'KS', 'JH', '7D', '5C', '3S'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 2) # 2 = Pair
        
    def test_high_card(self):
        cards = self._create_cards_from_strings(['AD', 'KS', 'JH', '7D', '5C', '3S', '2H'])
        rank, _ = evaluate_hand(cards)
        self.assertEqual(rank, 1) # 1 = High Card
