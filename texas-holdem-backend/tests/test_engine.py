import pytest
from game.engine import GameEngine
from game.player import Player
from game.card import Card, Rank, Suit

@pytest.fixture
def players():
    return [
        Player(id=0, name="p0", chips=1000, is_human=True),
        Player(id=1, name="p1", chips=1000),
        Player(id=2, name="p2", chips=1000),
        Player(id=3, name="p3", chips=1000),
    ]

def test_start_new_hand(players):
    engine = GameEngine(players)
    
    assert engine.stage == 'PRE_FLOP'
    assert engine.pot == 30  # 10 SB + 20 BB
    assert engine.bet_to_call == 20
    

    assert engine.dealer_pos == 1

    sb_player = engine.players[2]
    bb_player = engine.players[3]
    
    assert sb_player.chips == 990
    assert sb_player.current_bet == 10
    assert bb_player.chips == 980
    assert bb_player.current_bet == 20

    assert engine.active_player_id == 0

def test_player_action_fold(players):
    engine = GameEngine(players)
    
    player_id = 0
    engine.process_player_action(player_id, "fold")
    
    assert engine.players[player_id].is_folded
    assert engine.active_player_id == 1

def test_player_action_call(players):
    engine = GameEngine(players)
    
    player_id = 0
    engine.process_player_action(player_id, "call")

    player_0 = engine.players[player_id]
    assert player_0.chips == 980
    assert player_0.current_bet == 20
    assert engine.pot == 50 
    assert engine.active_player_id == 1

def test_player_action_raise(players):
    engine = GameEngine(players)
    
    player_id = 0
    amount = 60
    engine.process_player_action(player_id, "raise", amount)

    player_0 = engine.players[player_id]
    assert player_0.chips == 940
    assert player_0.current_bet == 60
    assert engine.bet_to_call == 60
    assert engine.active_player_id == 1

def test_action_out_of_turn(players):
    """Test that acting out of turn raises an error."""
    engine = GameEngine(players)
    
    # Active player is 0 (UTG), try to make Player 1 act
    with pytest.raises(ValueError, match="Not this player's turn"):
        engine.process_player_action(player_id=1, action="call")

def test_advance_stage_preflop_to_flop(players):
    """Test that the game advances to FLOP when everyone matches the bet."""
    engine = GameEngine(players)
    
    # Pre-flop: Bet to call is 20
    # P0 calls
    engine.process_player_action(0, "call")
    # P1 calls
    engine.process_player_action(1, "call")
    # P2 (SB) completes the blind (needs 10 more)
    engine.process_player_action(2, "call")
    # P3 (BB) checks (already put in 20)
    engine.process_player_action(3, "check")

    assert engine.stage == "FLOP"
    assert len(engine.community_cards) == 3
    assert engine.pot == 80  # 20 * 4
    assert engine.bet_to_call == 0  # Reset for new round
    # Post-flop action starts left of dealer (SB -> P2)
    assert engine.active_player_id == 2

def test_winner_everyone_folds(players):
    """Test that if everyone folds, the survivor wins immediately."""
    engine = GameEngine(players)
    
    # P0 folds
    engine.process_player_action(0, "fold")
    # P1 folds
    engine.process_player_action(1, "fold")
    # P2 (SB) folds
    engine.process_player_action(2, "fold")

    # P3 (BB) should win automatically
    assert engine.stage == "HAND_OVER"
    assert engine.winners == [3]
    # P3 gets the pot (30 initial + 0 from calls = 30)
    # P3 stack: 980 start + 30 pot = 1010
    assert players[3].chips == 1010

def test_showdown_determination(players):
    """Test that the game handles showdown correctly."""
    engine = GameEngine(players)
    
    # Fast-forward to River by forcing stage (cheating the engine for testing)
    engine.stage = "RIVER"
    engine.community_cards = [
        Card(Rank.ACE, Suit.SPADES), Card(Rank.ACE, Suit.HEARTS), Card(Rank.ACE, Suit.CLUBS), # Flop
        Card(Rank.KING, Suit.SPADES), # Turn
        Card(Rank.KING, Suit.HEARTS)  # River
    ] # Full House AAAKK on board
    
    # Give P0 a Quad (Ace)
    players[0].hand = [Card(Rank.ACE, Suit.DIAMONDS), Card(Rank.TWO, Suit.CLUBS)]
    # Give P1 a lower Full House (KK)
    players[1].hand = [Card(Rank.KING, Suit.CLUBS), Card(Rank.QUEEN, Suit.CLUBS)]
    # Fold others
    players[2].is_folded = True
    players[3].is_folded = True
    
    # Trigger showdown logic manually or via check-check
    engine.active_player_id = 0
    engine.bet_to_call = 0
    
    engine.process_player_action(0, "check")
    engine.process_player_action(1, "check")
    
    assert engine.stage == "HAND_OVER"
    assert engine.winners == [0] # P0 has Quads

def test_all_in_skips_turns(players):
    """Test that an All-In player is skipped in rotation but stays in game."""
    engine = GameEngine(players)
    
    # P0 goes All In (1000 chips)
    engine.process_player_action(0, "raise", 1000)
    
    assert players[0].is_all_in
    assert players[0].chips == 0
    assert engine.bet_to_call == 1000
    
    # P1 folds
    engine.process_player_action(1, "fold")
    
    # P2 folds
    engine.process_player_action(2, "fold")
    
    # P3 Calls All-in
    engine.process_player_action(3, "call") # Matches 1000
    
    # Now we go to Flop. 
    # Since P0 is All-in, and P3 is the only other active player, 
    # ideally the engine should auto-run to showdown, but at minimum:
    assert engine.stage != "PRE_FLOP" 
    # P0 should not be asked for actions anymore
    if engine.stage != "HAND_OVER":
        assert engine.active_player_id != 0