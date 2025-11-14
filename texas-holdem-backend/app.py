import time
import threading
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS

from game.engine import GameEngine
from game.player import Player
from ai.gemini_player import get_ai_decision

app = Flask(__name__)
app.config['SECRET_KEY'] = 'poker_secret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage
games: dict[str, GameEngine] = {}

def run_ai_cycle(game_id: str) -> None:
    """Background task to handle consecutive AI turns."""
    while True:
        game = games.get(game_id)
        if not game or game.stage == "HAND_OVER":
            break

        current_id = game.active_player_id
        if current_id == -1:
            break

        current_player = game.players[current_id]
        if current_player.is_human:
            break

        # Artificial delay for realism
        time.sleep(1.0)

        # Serialize state for AI
        state = game.to_dict(for_player_id=current_id)

        # Get Move
        move = get_ai_decision(state, current_id)

        try:
            game.process_player_action(
                current_id, move['action'], move.get('amount', 0)
            )
            socketio.emit('update', game.to_dict(for_player_id=0), to=game_id)
        except Exception as e: # pylint: disable=broad-except
            print(f"Err processing AI {current_id}: {e}")
            game.process_player_action(current_id, "fold")

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

    # If Human is not first (e.g., BB is pos 2, UTG is 3), trigger AI
    if engine.active_player_id != 0:
        threading.Thread(target=run_ai_cycle, args=(engine.id,)).start()

    return jsonify(engine.to_dict(for_player_id=0))

@app.route('/api/game/<game_id>/next', methods=['POST'])
def next_hand(game_id):
    game = games.get(game_id)
    if not game:
        return jsonify({"error": "Not found"}), 404

    game.start_new_hand()

    if game.active_player_id != 0:
        threading.Thread(target=run_ai_cycle, args=(game.id,)).start()

    return jsonify(game.to_dict(for_player_id=0))

# --- Socket Events ---

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

        # Trigger AI chain
        if game.active_player_id != 0:
            threading.Thread(target=run_ai_cycle, args=(game_id,)).start()

    except ValueError as e:
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, port=5001, debug=True)
