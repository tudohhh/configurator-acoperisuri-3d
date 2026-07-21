# calculation_engine_acoperisuri.py

def calculate_roof_estimate(config: dict, input_data: dict) -> dict:
    pricing = config["pricing_grid"]
    limits = config["limits"]
    
    mp = input_data.get("suprafata_mp_3d", 0)
    material_key = input_data.get("tip_material", "tabla_bilka_standard")
    lucrare_key = input_data.get("tip_lucrare", "montaj_simplu")
    include_demontare = input_data.get("demontare_veche", False)
    jgheaburi_ml = input_data.get("jgheaburi_ml", 0)

    # Validation Guardrails
    if mp < limits["min_realistic_mp"] or mp > limits["max_realistic_mp"]:
        return {
            "status": "REQUIRES_CONFIRMATION",
            "message": f"Suprafața de {mp} mp necesită verificare manuală cu un tehnician."
        }

    # Calcul Materiale + Pierderi Tăieturi (10%)
    pret_mat_mp = pricing["materiale_per_mp"].get(material_key, 45)
    cost_materiale = mp * pret_mat_mp * 1.10  # 10% pierderi pe pante/dolii

    # Calcul Manoperă
    pret_manopera_mp = pricing["manopera_per_mp"].get(lucrare_key, 35)
    cost_manopera = mp * pret_manopera_mp

    # Opționale
    cost_demontare = (mp * pricing["servicii_optionale"]["demontare_acoperis_vechi_per_mp"]) if include_demontare else 0
    cost_jgheaburi = jgheaburi_ml * pricing["servicii_optionale"]["jgheaburi_burlane_per_ml"]

    # Taxe Fixe (Transport)
    cost_transport = pricing["taxe_fixe"]["deplasare_transport_materiale"]

    # Total Bază
    total_baza = cost_materiale + cost_manopera + cost_demontare + cost_jgheaburi + cost_transport

    # Interval Toleranță +/- 10%
    toleranta = pricing["interval_toleranta_procent"]
    estimare_min = round(total_baza * (1 - toleranta))
    estimare_max = round(total_baza * (1 + toleranta))

    material_names = {
        "tabla_bilka_standard": "Tablă Bilka Standard (0.45mm)",
        "tabla_bilka_premium": "Tablă Bilka Premium (0.50mm GrandeMat)",
        "tigla_ceramica": "Țiglă Ceramică Premium"
    }

    return {
        "status": "SUCCESS",
        "rezumat": f"Acoperiș ~{mp} mp ({material_names.get(material_key, material_key)}) + {lucrare_key.replace('_', ' ')}",
        "estimare_min": estimare_min,
        "estimare_max": estimare_max,
        "tva_status": config["tva_status"],
        "disclaimer": config["disclaimer"],
        "cta_message": config["cta_message"]
    }
