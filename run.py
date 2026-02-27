#!/usr/bin/env python
"""
Development server runner for Netlify Credit Calculator.

Usage:
    python run.py

The Flask development server will start at http://localhost:5000
"""

import os
from app import create_app


if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    port = int(os.getenv('FLASK_PORT', 8080))
    print("Starting Netlify Credit Calculator Flask app...")
    print(f"Visit http://localhost:{port} in your browser")
    app.run(debug=True, host='0.0.0.0', port=port)
