import pytest
from app import app
from unittest.mock import patch

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

# Correct mock path to where get_ai_decision is imported in app.py
# or where it is defined. Based on app.py imports: 'ai.gemini_player.get_ai_decision'
@patch('ai.gemini_player.get_ai_decision')
def test_create_game_api(mock_get_ai, client):
    """Test game creation endpoint."""
    # Mock return must look like an AI decision
    mock_get_ai.return_value = {"action": "fold", "amount": 0}
    
    response = client.post('/api/game', json={"playerName": "Test Player"})
    assert response.status_code == 200
    
    data = response.get_json()
    assert data['gameId'] is not None
    assert len(data['players']) == 4
    assert data['players'][0]['name'] == 'Test Player'

def test_get_game_state_not_found(client):
    response = client.post('/api/game/nonexistent/next')
    assert response.status_code == 404
