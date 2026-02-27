#!/usr/bin/env python
"""
Frozen-Flask script for generating static HTML files.

Usage:
    python freeze.py

This will generate a 'build/' directory with all static HTML and assets.
"""

import os
from app import create_app, create_freezer


def main():
    app = create_app('production')
    freezer = create_freezer(app)

    print("Freezing Flask app...")
    freezer.freeze()
    print(f"Build complete! Check the 'build/' directory.")


if __name__ == '__main__':
    main()
