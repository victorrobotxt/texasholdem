import eventlet
eventlet.monkey_patch()

import time
import threading
import logging
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS

from game.engine import GameEngine
from game.player import Player
from ai.gemini_player import get_ai_decision

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('poker')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'poker_secret'
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet') 

games: dict[str, GameEngine] = {}

def run_ai_cycle(game_id: str) -> None:
    game = games.get(game_id)
    if not game:
        return
    
    while True:
        with game.lock:
            if game.stage == "HAND_OVER":
                logger.info(f"[{game_id[:8]}] AI cycle ended - hand over")
                break

            current_id = game.active_player_id
            if current_id == -1:
                break

            current_player = game.players[current_id]
            if current_player.is_human:
                logger.debug(f"[{game_id[:8]}] Waiting for human player")
                break

            state = game.to_dict(for_player_id=current_id)

        time.sleep(1.0)  
        
        move = get_ai_decision(state, current_id)
        logger.info(f"[{game_id[:8]}] AI {current_player.name}: {move['action']} {move.get('amount', '')}")

        with game.lock:
            try:
                game.process_player_action(
                    current_id, move['action'], move.get('amount', 0)
                )
                socketio.emit('update', game.to_dict(for_player_id=0), to=game_id)
            except Exception as e:
                logger.error(f"[{game_id[:8]}] Error processing AI {current_id}: {e}")
                game.process_player_action(current_id, "fold")
                socketio.emit('update', game.to_dict(for_player_id=0), to=game_id)

@app.route('/api/game', methods=['POST'])
def create_game():
    data = request.json or {}
    p_name = data.get('playerName', 'Human')

    human = Player(id=0, name=p_name, chips=1000, is_human=True)
    bots = [
        Player(id=1, name="Viper", chips=1000),
        Player(id=2, name="Mountain", chips=1000),
        Player(id=3, name="Shark", chips=1000)
    ]

    engine = GameEngine([human] + bots)
    games[engine.id] = engine

    if engine.active_player_id != 0:
        socketio.start_background_task(run_ai_cycle, engine.id)

    return jsonify(engine.to_dict(for_player_id=0))

@app.route('/api/game/<game_id>/next', methods=['POST'])
def next_hand(game_id):
    game = games.get(game_id)
    if not game:
        return jsonify({"error": "Not found"}), 404

    game.start_new_hand()

    if game.active_player_id != 0:
        socketio.start_background_task(run_ai_cycle, game.id)

    return jsonify(game.to_dict(for_player_id=0))

@socketio.on('join')
def on_join(data):
    room = data.get('gameId')
    join_room(room)
    if room in games:
        emit('update', games[room].to_dict(for_player_id=0))

@socketio.on('action')
def on_action(data):
    game_id = data.get('gameId')
    game = games.get(game_id)
    if not game:
        return

    try:
        game.process_player_action(0, data['action'], data.get('amount', 0))
        emit('update', game.to_dict(for_player_id=0), to=game_id)

        if game.active_player_id != 0:
            socketio.start_background_task(run_ai_cycle, game_id)

    except ValueError as e:
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
