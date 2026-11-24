#!/usr/bin/env python3
"""
Convenience launcher for KAVACH Prototype.
Usage: python3 run_kavach.py
"""
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from kavach.run import main

if __name__ == "__main__":
    main()
