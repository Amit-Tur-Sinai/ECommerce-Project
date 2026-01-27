import json
import os
from openrouter import OpenRouter
from typing import Dict, Tuple, List

# --- Your existing RECOMMENDATION_MAP and Helper Functions remain the same ---
RECOMMENDATION_MAP = {
    ("cold", "butcher_shop"): {
        "risk_level": "medium",
        "recommendations": [
            "Inspect refrigeration units to prevent overcooling",
            "Check delivery vehicles for cold-start issues",
            "Increase monitoring of frozen inventory temperatures"
        ]
    },
    ("heat", "butcher_shop"): {
        "risk_level": "critical",
        "recommendations": [
            "Increase refrigeration system load tolerance",
            "Inspect backup generators and fuel levels",
            "Prioritize sale of temperature-sensitive inventory"
        ]
    }
}

def get_active_risk_payloads(binary_risk, probabilities, store_type):
    payloads = []
    for event, is_risk in binary_risk.items():
        if is_risk and (event, store_type) in RECOMMENDATION_MAP:
            payloads.append({
                "climate_event": event,
                "probability": probabilities[event],
                "store_type": store_type,
                "action_plan": RECOMMENDATION_MAP[(event, store_type)]
            })
    return payloads

# 2. UPDATED QWEN CALL FOR INTERNATIONAL REGION
def request_qwen_explanation(payload: Dict) -> str:
    prompt = f"""
    You are a business risk advisor. Explain this weather risk assessment:
    {json.dumps(payload, indent=2)}

    Explain why it matters, what to prioritize, and the financial impact.
    Limit the response to a single paragraph. The style should be professional and friendly.
    """

    try:
        with OpenRouter(
            api_key = "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"
        ) as client:
            response = client.chat.send(
                model="qwen/qwen-2.5-vl-7b-instruct:free",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
        return response.choices[0].message.content
    except Exception as e:
        return f"Connection Error: {e}"

# 3. EXECUTION
if True:
    climate_probs = {"cold": 0.62, "heat": 0.81}
    store = "butcher_shop"

    # Simple binary filter
    active_risks = {k: v >= 0.5 for k, v in climate_probs.items()}
    payloads = get_active_risk_payloads(active_risks, climate_probs, store)

    for p in payloads:
        print(f"\n--- ADVICE FOR {p['climate_event'].upper()} ---")
        print(request_qwen_explanation(p))
