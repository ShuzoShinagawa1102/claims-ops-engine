#!/usr/bin/env python3
"""Standalone script to seed the Claims Ops Engine with sample data."""
import requests

BASE_URL = "http://localhost:8000"


def main():
    resp = requests.post(f"{BASE_URL}/api/seed")
    resp.raise_for_status()
    print(resp.json())


if __name__ == "__main__":
    main()
