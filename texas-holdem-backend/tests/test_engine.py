import pytest
from game.engine import GameEngine
from game.player import Player

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
    utg_player = engine.players[0]
    
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
