# Texas Hold'em AI Backend

A Flask-SocketIO Python backend implementing the complete rules of Texas Hold'em, designed to be graded for Python code quality and architecture.

## Architecture
- **`app.py`**: Entry point, manages WebSocket connections and background threads.
- **`game/`**: Pure Python logic.
  - `engine.py`: State machine handling game stages and turn rotation.
  - `hand_evaluator.py`: Mathematical logic to determine hand strength.
  - `card.py` / `deck.py`: Core data models.
- **`ai/`**: Integration with Google Gemini for opponent logic.

## Installation

1. **Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configuration**:
   Create a `.env` file:
   ```ini
   GOOGLE_API_KEY="your_key_here"
   FLASK_ENV=development
   SECRET_KEY="dev_key"
   ```

3. **Run**:
   ```bash
   python app.py
   ```

## Testing
To verify logic and code coverage:
```bash
pytest --cov=game tests/
```