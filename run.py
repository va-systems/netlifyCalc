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
    print("Starting Netlify Credit Calculator Flask app...")
    print("Visit http://localhost:3000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=3000)
