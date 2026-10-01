# -*- coding: utf-8 -*-
"""
Madrasah Abdul Rehman Bin Auf - Activation Key Generator
مدرسہ عبد الرحمن ؓ بن عوف غفوریہ - ایکٹیویشن کی جنریٹر
"""

import sys
import re

ACTIVATION_SALT = "MADRASAH_PRO_SECRET_KEY_2026"
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

def clean_string(s):
    if not s:
        return ""
    return re.sub(r'[^A-Z0-9]', '', s.upper())

def calculate_key(raw_hwid):
    hwid = clean_string(raw_hwid)
    if not hwid:
        return ""

    blocks = []
    for b in range(1, 5):
        sum_val = b * 7919
        for i, char in enumerate(hwid):
            hwid_char = ord(char)
            salt_index = (i + b * 5) % len(ACTIVATION_SALT)
            salt_char = ord(ACTIVATION_SALT[salt_index])
            sum_val = (sum_val * 33 + hwid_char * 17 + salt_char * 13) % 1048573

        block_str = ""
        for _ in range(4):
            idx = sum_val % 32
            block_str += ALPHABET[idx]
            sum_val //= 32

        blocks.append(block_str)

    return "AK-" + "-".join(blocks)

def main():
    print("=" * 60)
    print("  مدرسہ عبد الرحمن ؓ بن عوف غفوریہ - خانیوال")
    print("  ایکٹیویشن کی جنریٹر (Activation Key Generator)")
    print("=" * 60)

    if len(sys.argv) > 1:
        hwid = sys.argv[1].strip()
    else:
        try:
            hwid = input("\nکلائنٹ کا ہارڈویئر آئی ڈی درج کریں (Hardware ID): ").strip()
        except (EOFError, KeyboardInterrupt):
            return

    if not hwid:
        print("کوئی ہارڈویئر آئی ڈی فراہم نہیں کی گئی!")
        return

    key = calculate_key(hwid)
    print("\n" + "-" * 50)
    print(f"  ہارڈویئر آئی ڈی: {hwid}")
    print(f"  ایکٹیویشن کی : {key}")
    print("-" * 50)
    print("\nیہ کی کلائنٹ کو واٹس ایپ یا ایس ایم ایس کر دیں۔\n")

if __name__ == "__main__":
    main()
