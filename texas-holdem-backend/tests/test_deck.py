import unittest
from game.deck import Deck
from game.card import Card

class TestDeck(unittest.TestCase):

    def setUp(self):
        """Set up a new deck for each test."""
        self.deck = Deck()

    def test_deck_creation(self):
        """Test if the deck is created with 52 unique cards."""
        self.assertEqual(len(self.deck._cards), 52, "Deck should have 52 cards")
        
        # Use private attribute _cards for verification
        card_strings = {card.to_str() for card in self.deck._cards}
        self.assertEqual(len(card_strings), 52, "All cards in the deck should be unique")

    def test_shuffle(self):
        """Test if the shuffle method actually changes the order of cards."""
        initial_order = [card.to_str() for card in self.deck._cards]
        self.deck.shuffle()
        shuffled_order = [card.to_str() for card in self.deck._cards]
        
        # It is statistically possible but highly unlikely to be equal
        self.assertNotEqual(initial_order, shuffled_order, "Shuffle should change the card order")
        self.assertEqual(len(shuffled_order), 52, "Shuffled deck should still have 52 cards")

    def test_deal(self):
        """Test dealing a card from the deck."""
        # Note: Deck logic usually deals from index 0 or pops. 
        # Our implementation slices from 0.
        top_card = self.deck._cards[0] 
        
        # Deal returns a LIST of cards
        dealt_cards = self.deck.deal(1)
        dealt_card = dealt_cards[0]
        
        self.assertIsInstance(dealt_card, Card, "Dealt object should be a Card")
        self.assertEqual(dealt_card.to_str(), top_card.to_str(), "Deal should return the top card")
        self.assertEqual(len(self.deck._cards), 51, "Deck should have 51 cards after dealing one")

    def test_deal_empty_deck(self):
        """Test that dealing from an empty deck raises an error."""
        # Deal all 52 cards
        self.deck.deal(52)
        
        self.assertEqual(len(self.deck._cards), 0, "Deck should be empty")
        
        # Expect a ValueError when dealing from an empty deck
        with self.assertRaises(ValueError):
            self.deck.deal(1)
