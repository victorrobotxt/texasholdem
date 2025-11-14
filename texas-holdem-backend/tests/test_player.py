import unittest
from game.player import Player

class TestPlayer(unittest.TestCase):

    def setUp(self):
        """Set up a player for each test."""
        # Use 'id' keyword arg
        self.player = Player(id=1, name="TestBot", chips=1000)

    def test_player_initialization(self):
        """Test if player attributes are initialized correctly."""
        self.assertEqual(self.player.id, 1)
        self.assertEqual(self.player.name, "TestBot")
        self.assertEqual(self.player.chips, 1000)
        self.assertFalse(self.player.is_folded)
        self.assertEqual(self.player.current_bet, 0)

    def test_place_bet(self):
        """Test placing a valid bet (named 'bet' in new impl)."""
        self.player.bet(100)
        self.assertEqual(self.player.chips, 900)
        self.assertEqual(self.player.current_bet, 100)
        
        # Test placing another bet (cumulative logic handled by caller/player state)
        # The method .bet(amount) reduces chips by 'amount' and adds to current_bet
        self.player.bet(50)
        self.assertEqual(self.player.chips, 850)
        self.assertEqual(self.player.current_bet, 150)

    def test_place_bet_all_in(self):
        """Test betting all chips."""
        self.player.bet(1000)
        self.assertEqual(self.player.chips, 0)
        self.assertEqual(self.player.current_bet, 1000)
        self.assertTrue(self.player.is_all_in)

    def test_place_bet_insufficient_funds(self):
        """Test logic for betting more than chips (should cap at stack)."""
        # The new implementation .bet() clamps the value, doesn't raise Error
        # but simply bets everything they have.
        added = self.player.bet(1001)
        
        self.assertEqual(added, 1000) # Should only take what they have
        self.assertEqual(self.player.chips, 0)
        self.assertTrue(self.player.is_all_in)

    def test_fold(self):
        """Test the fold action."""
        self.player.fold()
        self.assertTrue(self.player.is_folded)
        self.assertEqual(self.player.last_action, "Fold")

    def test_reset_for_new_hand(self):
        """Test resetting player state for a new hand."""
        self.player.bet(100)
        self.player.fold()
        self.player.hand.append("dummy_card")
        
        # New method name is reset_hand_state
        self.player.reset_hand_state()
        
        self.assertEqual(self.player.hand, [])
        self.assertEqual(self.player.current_bet, 0)
        self.assertFalse(self.player.is_folded)
        self.assertFalse(self.player.is_all_in)
