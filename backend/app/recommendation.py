import json
import os
from pathlib import Path
from openrouter import OpenRouter
from typing import Dict, Tuple, List, Any

# Configuration constant
RISK_THRESHOLD = 0.2  # 20% for demo purposes

# Get the project root directory (parent of 'app' directory)
PROJECT_ROOT = Path(__file__).parent.parent
RECOMMENDATIONS_FILE = PROJECT_ROOT / "recommendations.json"


def load_recommendation_map(path: str) -> Dict[Tuple[str, str], Dict]:
    """
    Loads recommendations from a JSON file and returns a map
    keyed by (climate_event, store_type).
    
    Args:
        path: Path to the recommendations JSON file
        
    Returns:
        Dictionary mapping (climate_event, store_type) tuples to recommendation data
        
    Raises:
        FileNotFoundError: If the recommendations file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Recommendations file not found: {path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in recommendations file '{path}': {e}")

    recommendation_map: Dict[Tuple[str, str], Dict] = {}

    for entry in data["recommendations"]:
        key = (entry["climate_event"], entry["store_type"])
        recommendation_map[key] = {
            "risk_level": entry["risk_level"],
            "recommendations": entry["recommendations"]
        }

    return recommendation_map

try:
    RECOMMENDATION_MAP = load_recommendation_map(str(RECOMMENDATIONS_FILE))
except (FileNotFoundError, ValueError) as e:
    # Fallback to empty map if file not found - allows module to load but will fail at runtime
    RECOMMENDATION_MAP: Dict[Tuple[str, str], Dict] = {}
    print(f"Warning: Could not load recommendations map: {e}")

def get_active_risk_payloads(
    binary_risk: Dict[str, bool], 
    probabilities: Dict[str, float], 
    store_type: str
) -> List[Dict[str, Any]]:
    """
    Creates payload dictionaries for active climate risks that have recommendations.
    
    Args:
        binary_risk: Dictionary mapping climate events to boolean risk status
        probabilities: Dictionary mapping climate events to their probability values
        store_type: Type of store (e.g., "butcher_shop", "winery")
        
    Returns:
        List of payload dictionaries containing climate event, probability, store type, and action plan
    """
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

def request_qwen_explanation(payload: Dict[str, Any]) -> str:
    """
    Requests an AI-generated explanation for a weather risk assessment from Qwen via OpenRouter.
    
    Args:
        payload: Dictionary containing climate event, probability, store type, and action plan
        
    Returns:
        AI-generated explanation string, or error message if API call fails
    """
    climate_event = payload.get("climate_event", "unknown")
    probability = payload.get("probability", 0.0)
    store_type = payload.get("store_type", "unknown")
    action_plan = payload.get("action_plan", {})
    risk_level = action_plan.get("risk_level", "unknown")
    recommendations = action_plan.get("recommendations", [])
    
    # Format store type for better readability
    store_type_formatted = store_type.replace("_", " ").title()
    
    prompt = f"""You are an expert business risk advisor specializing in weather-related business impacts.

WEATHER RISK ASSESSMENT:
- Climate Event: {climate_event.upper()}
- Probability: {probability:.0%}
- Store Type: {store_type_formatted}
- Risk Level: {risk_level.upper()}
- All Recommended Actions:
{chr(10).join(f'  • {rec}' for rec in recommendations)}

TASK: Provide a response in the following format:

1. PARAGRAPH (3-4 sentences): Explain the specific business risk, why it matters for this type of store, prioritize the most critical actions, estimate potential financial impact if risks are not addressed, and use a friendly, actionable tone that encourages immediate action. Be specific about what could happen if no action is taken.

2. TOP 3 RECOMMENDATIONS LIST: After the paragraph, include a numbered list of the top 3 most critical recommendations from the list above. Format as:
   1. [First most critical recommendation]
   2. [Second most critical recommendation]
   3. [Third most critical recommendation]

Focus on practical business consequences and urgency based on the risk level. Select the top 3 recommendations that will have the greatest impact on protecting the business and preventing losses."""

    try:
        api_key_file = PROJECT_ROOT / "recommendation_api_key.txt"
        with open(str(api_key_file), "r", encoding="utf-8") as api_file:
            key = api_file.readline().strip()
            if not key:
                return "Error: API key file is empty"
    except FileNotFoundError:
        return "Error: API key file not found"
    except Exception as e:
        return f"Error reading API key: {e}"

    try:
        with OpenRouter(api_key=key) as client:
            response = client.chat.send(
                model="qwen/qwen-2.5-7b-instruct:free",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
        explanation_text = response.choices[0].message.content
        return explanation_text if explanation_text else "AI explanation generated successfully."
    except Exception as e:
        error_msg = str(e)
        # Return a fallback explanation if API fails - still provide useful info
        fallback = f"""Based on the {risk_level.upper()} risk level for {climate_event.upper()} events (predicted probability: {probability:.0%}), your {store_type_formatted} faces significant operational challenges that require immediate attention.

Failure to address these risks could result in equipment damage, inventory loss, operational disruptions, and potential revenue loss. The weather conditions indicate a {probability:.0%} probability of {climate_event} events occurring, which poses a {risk_level} level threat to your business operations.

The most critical actions to protect your business include: {recommendations[0] if recommendations else 'monitoring weather conditions closely'}, {recommendations[1] if len(recommendations) > 1 else 'preparing backup systems'}, and {recommendations[2] if len(recommendations) > 2 else 'ensuring staff safety protocols'}."""
        return fallback

def generate_recommendations(
    probabilities: Dict[str, float], 
    store_type: str = "butcher_shop",
    risk_threshold: float = RISK_THRESHOLD
) -> List[Dict[str, Any]]:
    """
    Generate recommendations based on climate event probabilities.
    
    Args:
        probabilities: Dictionary mapping climate events to their probability values (0.0-1.0)
                      Expected keys: "cold", "fog", "storm", "heat"
        store_type: Type of store to generate recommendations for (default: "butcher_shop")
        risk_threshold: Probability threshold above which an event is considered an active risk
                       (default: 0.5)
    
    Returns:
        List of recommendation dictionaries, each containing:
        - climate_event: The type of climate event
        - risk_level: Risk level (e.g., "low", "medium", "high", "critical")
        - recommendations: List of recommended actions
        - explanation: AI-generated explanation of the risk
        
    Example:
        >>> probs = {"cold": 0.62, "heat": 0.81, "fog": 0.15, "storm": 0.30}
        >>> results = generate_recommendations(probs, store_type="butcher_shop")
        >>> len(results)  # Only cold and heat are above 0.5 threshold
        2
    """
    # Validate input probabilities
    if not probabilities:
        return []
    
    # Validate probability values are between 0 and 1
    for event, prob in probabilities.items():
        if not isinstance(prob, (int, float)) or prob < 0 or prob > 1:
            raise ValueError(
                f"Invalid probability value for '{event}': {prob}. "
                "Probabilities must be between 0.0 and 1.0"
            )
    
    # Filter active risks using configurable threshold
    active_risks = {k: v >= risk_threshold for k, v in probabilities.items()}
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
