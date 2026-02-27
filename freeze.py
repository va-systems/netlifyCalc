#!/usr/bin/env python
"""
Frozen-Flask script for generating static HTML files.

Usage:
    python freeze.py

This will generate a 'build/' directory with all static HTML and assets.
"""

import os
from app import create_app
from flask_frozen import Freezer


def main():
    app = create_app('production')
    freezer = Freezer(app)

    @freezer.register_generator
    def index_generator():
        yield '/'

    print("Freezing Flask app...")
    freezer.freeze()
    print(f"Build complete! Check the 'build/' directory.")


if __name__ == '__main__':
    main()
