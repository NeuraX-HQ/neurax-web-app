# ---------- /health or / ---------- 

# curl -X 'GET' \
#   'http://127.0.0.1:8000/' \
#   -H 'accept: application/json'

{
  "status": "ok",
  "qwen_model": "qwen.qwen3-vl-235b-a22b",
  "usda_ready": true,
  "avocavo_ready": true,
  "openfoodfacts_ready": true
}

# ---------- /analyze-food ----------

# curl -X 'POST' \
#   'http://127.0.0.1:8000/analyze-food?method=tools' \
#   -H 'accept: application/json' \
#   -H 'Content-Type: multipart/form-data' \
#   -F 'file=@hao_hao.jpg;type=image/jpeg'

{
  "success": true,
  "method": "POST",
  "endpoint": "/analyze-food",
  "feature": "food_analysis",
  "query_params": {
    "method": "tools"
  },
  "image": "hao_hao.jpg",
  "data": {
    "dishes": [],
    "image_quality": null
  },
  "message": "Detected 0 dish(es).",
  "time_s": 1.42
}

{
  "success": true,
  "method": "POST",
  "endpoint": "/analyze-food",
  "feature": "food_analysis",
  "query_params": {
    "method": "tools"
  },
  "image": "fast_food.jpg",
  "data": {
    "dishes": [
      {
        "name": "fried potatoes",
        "serving_value": 150,
        "serving_unit": "g",
        "confidence": 0.9,
        "cooking_method": "fried",
        "ingredients": [
          {
            "name": "potatoes",
            "weight": 150,
            "nutritions": {
              "calories": 282,
              "protein": 3.53,
              "carbs": 37.05,
              "fat": 12.36
            },
            "confidence": 0.9,
            "note": "fried with vegetable oil"
          }
        ],
        "weight": 150,
        "nutritions": {
          "calories": 282,
          "protein": 3.53,
          "carbs": 37.05,
          "fat": 12.36
        },
        "expiry_days": 2,
        "scale_reference": ""
      },
      {
        "name": "egg and tomato sandwich",
        "serving_value": 190,
        "serving_unit": "g",
        "confidence": 0.9,
        "cooking_method": "grilled",
        "ingredients": [
          {
            "name": "egg",
            "weight": 50,
            "nutritions": {
              "calories": 119.2,
              "protein": 5.68,
              "carbs": 15.11,
              "fat": 4.01
            },
            "confidence": 0.9,
            "note": "on sandwich"
          },
          {
            "name": "tomato",
            "weight": 30,
            "nutritions": {
              "calories": 35.8,
              "protein": 1.7,
              "carbs": 4.53,
              "fat": 1.2
            },
            "confidence": 0.9,
            "note": "slice in sandwich"
          },
          {
            "name": "bread",
            "weight": 110,
            "nutritions": {
              "calories": 261.9,
              "protein": 12.5,
              "carbs": 33.3,
              "fat": 9.81
            },
            "confidence": 0.9,
            "note": "toasted bagel base"
          }
        ],
        "weight": 190,
        "nutritions": {
          "calories": 476.9,
          "protein": 22.74,
          "carbs": 60.44,
          "fat": 16.02
        },
        "expiry_days": 2,
        "scale_reference": ""
      }
    ],
    "image_quality": "plate~250g"
  },
  "message": "Detected 12 dish(es).",
  "time_s": 37.07
}

# ---------- /analyze-label ----------

# curl -X 'POST' \
#   'http://127.0.0.1:8000/analyze-label' \
#   -H 'accept: application/json' \
#   -H 'Content-Type: multipart/form-data' \
#   -F 'file=@sushi.jpg;type=image/jpeg'

{
  "success": true,
  "method": "POST",
  "endpoint": "/analyze-label",
  "feature": "label_analysis",
  "image": "sushi.jpg",
  "data": {
    "labels": [],
    "image_quality": null
  },
  "message": "No nutrition label detected in the image.",
  "time_s": 0.92,
  "label_detected": false
}

{
  "success": true,
  "method": "POST",
  "endpoint": "/analyze-label",
  "feature": "label_analysis",
  "image": "hao_hao.jpg",
  "data": {
    "labels": [
      {
        "product_id": 1,
        "name": "Mì Ăn Liền",
        "brand": "Doraemon Với An Toàn Gia Thông",
        "serving_value": 75,
        "serving_unit": "g",
        "nutrition": [
          {
            "nutrient": "Giá trị năng lượng",
            "value": 350,
            "unit": "kcal",
            "dv_percentage": 0
          },
          {
            "nutrient": "Chất béo",
            "value": 13,
            "unit": "g",
            "dv_percentage": 0
          },
          {
            "nutrient": "Carbohydrate",
            "value": 51.4,
            "unit": "g",
            "dv_percentage": 0
          },
          {
            "nutrient": "Chất đạm",
            "value": 6.9,
            "unit": "g",
            "dv_percentage": 0
          }
        ],
        "ingredients": [
          "bột mì",
          "dầu thực vật",
          "chất chống oxy hóa (bha 320,bht 321)",
          "tinh bột",
          "muối",
          "đường",
          "nước mắm",
          "chất điều vị (mononatri glutamat 621)",
          "chất ổn định (pentantri phosphat 451(i))",
          "kali carbonat 501(iii)",
          "chất điều chỉnh độ acid (natri carbonat 500(iii))",
          "bột nghệ",
          "chất tạo màu tự nhiên (curcumin 100(i))",
          "đường",
          "muối",
          "dầu thực vật",
          "chất chống oxy hóa (bha 320,bht 321)",
          "chất điều vị (mononatri glutamat 621)",
          "dinatri 5’-inosinat 631",
          "dinatri 5’-guanylat 627",
          "chất điều chỉnh độ acid (acid citric 330)",
          "bột tôm 2.83 g/kg",
          "hành lá sấy",
          "nước mắm",
          "chất tạo màu tự nhiên (paprika oleoresin 160c)",
          "curcumin 100(i)",
          "chất tạo ngọt tổng hợp (aspartam 951)"
        ],
        "allergens": [
          "wheat",
          "soy",
          "fish",
          "shrimp"
        ],
        "expiry_days": null,
        "confidence": 0.9,
        "note": "Vietnamese instant noodle product"
      }
    ],
    "image_quality": null
  },
  "message": "No nutrition label detected in the image.",
  "time_s": 7.92,
  "label_detected": false
}

# ---------- /scan-barcode ----------

# curl -X 'POST' \
#   'http://127.0.0.1:8000/scan-barcode' \
#   -H 'accept: application/json' \
#   -H 'Content-Type: multipart/form-data' \
#   -F 'file=@unknow.png;type=image/png'

{
  "success": true,
  "method": "POST",
  "endpoint": "/scan-barcode",
  "feature": "barcode_scan",
  "image": "unknow.png",
  "data": {
    "food": null,
    "found": false,
    "message": "No barcode detected in image",
    "scan_time_s": 0.033,
    "total_time_s": 0.033
  },
  "message": "No barcode detected in image.",
  "time_s": 0.04
}

{
  "success": true,
  "method": "POST",
  "endpoint": "/scan-barcode",
  "feature": "barcode_scan",
  "image": "barcode.png",
  "data": {
    "food": {
      "barcode": "8934563138165",
      "product_name": "Hao Hao Mi Tom Chua Cay (hot Sour Shrimp Flavor Noodle)",
      "brands": "Vina acecook",
      "quantity": "75 g",
      "category": "instant noodles",
      "ingredients_text": "Nudeln (68 g): WEIZENmehl (Amerika, Australien, Kanada) 58%, Pflanzenöl (Palmöl, Antioxidationsmittel E320, E321), Tapiokastärke, Salz, Zucker, FISCHsauce, Geschmacksverstärker: E621, Säureregulator: E451, E500, E501; Suppenpulver (6,9 g): Zucker, Salz, Gewürze, Geschmacksverstärker: E621, E627, E631; Säureregulator: E330; GARNELENpulver 0,3%, getrocknete Frühlingszwiebel; Würzöl (2,1 g): Pflanzenöl (Palmöl, Antioxidationsmittel E320, E321), Gewürze, FISCHsauce, Salz, Aroma, Farbstoff: E160a.",
      "ingredients": [
        "nudeln",
        "pflanzenöl",
        "tapiokastärke",
        "salz",
        "zucker",
        "fischsauce",
        "geschmacksverstärker",
        "säureregulator",
        "e500",
        "e501",
        "suppenpulver",
        "gewürze",
        "e627",
        "e631",
        "garnelenpulver",
        "getrocknete frühlingszwiebel",
        "würzöl",
        "aroma",
        "farbstoff"
      ],
      "allergens": [
        "crustaceans",
        "fish",
        "gluten"
      ],
      "nutritions": {
        "calories": 455,
        "protein": 10.39,
        "fat": 18.18,
        "carbs": 63.64,
        "fiber": 2.53246753246753,
        "salt": 6.65584415584415,
        "sugar": 10.39,
        "sodium": 2.66233766233766
      },
      "labels": {
        "nova_group": 4,
        "ecoscore": "b"
      },
      "images": {
        "front": "https://images.openfoodfacts.org/images/products/893/456/313/8165/front_vi.38.400.jpg",
        "ingredients": "https://images.openfoodfacts.org/images/products/893/456/313/8165/ingredients_vi.33.400.jpg",
        "nutrition": "https://images.openfoodfacts.org/images/products/893/456/313/8165/nutrition_vi.23.400.jpg"
      }
    },
    "barcode": "8934563138165",
    "product_name": "Hao Hao Mi Tom Chua Cay (hot Sour Shrimp Flavor Noodle)",
    "brands": "Vina acecook",
    "quantity": "75 g",
    "category": "instant noodles",
    "ingredients_text": "Nudeln (68 g): WEIZENmehl (Amerika, Australien, Kanada) 58%, Pflanzenöl (Palmöl, Antioxidationsmittel E320, E321), Tapiokastärke, Salz, Zucker, FISCHsauce, Geschmacksverstärker: E621, Säureregulator: E451, E500, E501; Suppenpulver (6,9 g): Zucker, Salz, Gewürze, Geschmacksverstärker: E621, E627, E631; Säureregulator: E330; GARNELENpulver 0,3%, getrocknete Frühlingszwiebel; Würzöl (2,1 g): Pflanzenöl (Palmöl, Antioxidationsmittel E320, E321), Gewürze, FISCHsauce, Salz, Aroma, Farbstoff: E160a.",
    "ingredients": [
      "nudeln",
      "pflanzenöl",
      "tapiokastärke",
      "salz",
      "zucker",
      "fischsauce",
      "geschmacksverstärker",
      "säureregulator",
      "e500",
      "e501",
      "suppenpulver",
      "gewürze",
      "e627",
      "e631",
      "garnelenpulver",
      "getrocknete frühlingszwiebel",
      "würzöl",
      "aroma",
      "farbstoff"
    ],
    "allergens": [
      "crustaceans",
      "fish",
      "gluten"
    ],
    "nutritions": {
      "calories": 455,
      "protein": 10.39,
      "fat": 18.18,
      "carbs": 63.64,
      "fiber": 2.53246753246753,
      "salt": 6.65584415584415,
      "sugar": 10.39,
      "sodium": 2.66233766233766
    },
    "labels": {
      "nova_group": 4,
      "ecoscore": "b"
    },
    "images": {
      "front": "https://images.openfoodfacts.org/images/products/893/456/313/8165/front_vi.38.400.jpg",
      "ingredients": "https://images.openfoodfacts.org/images/products/893/456/313/8165/ingredients_vi.33.400.jpg",
      "nutrition": "https://images.openfoodfacts.org/images/products/893/456/313/8165/nutrition_vi.23.400.jpg"
    },
    "found": true,
    "message": "product found",
    "source": "L1 RAM cache",
    "cache_level": "L1",
    "scan_time_s": 0.005,
    "total_time_s": 0.007
  },
  "message": "Barcode 8934563138165 found (source=L1 RAM cache).",
  "time_s": 0.01
}