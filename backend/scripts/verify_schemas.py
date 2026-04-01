import os
import json
import re

def get_json_blocks(content):
    # Find JSON-like structures in python string variables
    json_blocks = []
    # Simplified regex to find JSON objects in the prompts
    matches = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content)
    for m in matches:
        try:
            # Clean up potential python formatting artifacts if any
            clean_m = m.replace('{{', '{').replace('}}', '}')
            json_blocks.append(json.loads(clean_m))
        except:
            continue
    return json_blocks

def verify_macros(obj, expected_keys):
    if isinstance(obj, dict):
        if 'macros' in obj:
            macros = obj['macros']
            for key in expected_keys:
                if key not in macros:
                    print(f"  [MISSING MACRO] {key}")
        for k, v in obj.items():
            verify_macros(v, expected_keys)
    elif isinstance(obj, list):
        for item in obj:
            verify_macros(item, expected_keys)

def verify_ingredients(obj):
    if isinstance(obj, dict):
        if 'ingredients' in obj or 'ingredients_from_fridge' in obj:
            ing_key = 'ingredients' if 'ingredients' in obj else 'ingredients_from_fridge'
            ings = obj[ing_key]
            if isinstance(ings, list) and len(ings) > 0:
                for ing in ings:
                    if isinstance(ing, dict):
                        if 'weight_g' not in ing:
                            print(f"  [MISSING WEIGHT] {ing.get('name', 'unknown')} is missing weight_g")
                    else:
                        print(f"  [OLD FORMAT] Ingredient is not an object: {ing}")
        for k, v in obj.items():
            verify_ingredients(v)
    elif isinstance(obj, list):
        for item in obj:
            verify_ingredients(item)

MACRO_KEYS = ['calories', 'protein_g', 'carbs_g', 'fat_g']

PROMPT_DIR = r'd:\Downloads\stitch_nutritrack_ui_ux\NutriTrack\docs\prompts'

print("Starting verification of prompts vs schemas standard...")

for root, dirs, files in os.walk(PROMPT_DIR):
    if 'challenges' in root.lower(): continue
    for file in files:
        if file.endswith('_prompt.py'):
            path = os.path.join(root, file)
            print(f"\nChecking {file}...")
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                blocks = get_json_blocks(content)
                if not blocks:
                    # Alternative: find parts that look like JSON in the output examples
                    pass
                for b in blocks:
                    verify_macros(b, MACRO_KEYS)
                    verify_ingredients(b)

print("\nVerification complete.")
