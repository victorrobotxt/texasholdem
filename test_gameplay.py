import requests
import socketio
import sys

BASE_URL = "http://localhost:5001"
sio = socketio.Client()

def test_poker_game():
    print(f"--- 1. Creating Game via REST API ({BASE_URL}) ---")
    try:
        resp = requests.post(f"{BASE_URL}/api/game", json={"playerName": "Terminal_Tester"})
        resp.raise_for_status()
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return

    game_data = resp.json()
    game_id = game_data['gameId']
    print(f"✅ Game Created! ID: {game_id}")
    
    print("\n--- 2. Connecting via SocketIO ---")
    @sio.on('connect')
    def on_connect():
        print("✅ Connected to WebSocket")
        sio.emit('join', {'gameId': game_id})

    @sio.on('update')
    def on_update(data):
        print(f"\n[UPDATE] Stage: {data['stage']} | Pot: ${data['pot']}")
        
        active_player = None
        for p in data['players']:
            action = p.get('lastAction') or "Waiting"
            print(f"  > {p['name']}: ${p['chips']} ({action})")
            if p['id'] == data['activePlayerId']:
                active_player = p

        if data['activePlayerId'] == 0:
            print("\n🟢 IT IS YOUR TURN!")
            to_call = data['betToCall'] - next(p['currentBet'] for p in data['players'] if p['id'] == 0)
            if to_call > 0:
                print(f"Action: Calling ${to_call}...")
                sio.emit('action', {'gameId': game_id, 'action': 'call'})
            else:
                print("Action: Checking...")
                sio.emit('action', {'gameId': game_id, 'action': 'check'})
        
        if data['stage'] == "HAND_OVER":
            print(f"\n🏆 HAND OVER. Winners: {data['winners']}")
            print("Test Successful. Exiting...")
            sio.disconnect()
            sys.exit(0)

    sio.connect(BASE_URL)
    sio.wait()

if __name__ == "__main__":
    test_poker_game()