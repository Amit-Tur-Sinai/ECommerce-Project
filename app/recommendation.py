import json
from openrouter import OpenRouter
from typing import Dict, Tuple, List


def load_recommendation_map(path: str) -> Dict[Tuple[str, str], Dict]:
    """
    Loads recommendations from a JSON file and returns a map
    keyed by (climate_event, store_type).
    """

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    recommendation_map: Dict[Tuple[str, str], Dict] = {}

    for entry in data["recommendations"]:
        key = (entry["climate_event"], entry["store_type"])
        recommendation_map[key] = {
            "risk_level": entry["risk_level"],
            "recommendations": entry["recommendations"]
        }

    return recommendation_map

RECOMMENDATION_MAP = load_recommendation_map("../recommendations.json")

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

def request_qwen_explanation(payload: Dict) -> str:
    prompt = f"""
    You are a business risk advisor. Explain this weather risk assessment:
    {json.dumps(payload, indent=2)}

    Explain why it matters, what to prioritize, and the financial impact.
    Limit the response to a single paragraph. The style should be professional and friendly.
    """

    with open("../recommendation_api_key.txt") as api_file:
        key = api_file.readline()

    try:
        with OpenRouter(
            api_key = key
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

def generate_recommendations(probabilities: Dict[str, float], store_type: str = "butcher_shop") -> List[Dict]:
    """
    Generate recommendations based on climate event probabilities.
    """
    # Simple binary filter (0.5 threshold)
    active_risks = {k: v >= 0.5 for k, v in probabilities.items()}
    payloads = get_active_risk_payloads(active_risks, probabilities, store_type)

    results = []
    for payload in payloads:
        explanation = request_qwen_explanation(payload)
        results.append({
            "climate_event": payload["climate_event"],
            "risk_level": payload["action_plan"]["risk_level"],
            "recommendations": payload["action_plan"]["recommendations"],
            "explanation": explanation
        })
    return results

if __name__ == "__main__": # test qwen api
    climate_probs = {"cold": 0.62, "heat": 0.81}
    results = generate_recommendations(climate_probs)

    for r in results:
        print(f"\n--- ADVICE FOR {r['climate_event'].upper()} ---")
        print(r['explanation'])
