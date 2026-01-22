from fastapi import FastAPI, HTTPException
from app.predict import get_event_probabilities
from app.recommendation import generate_recommendations

app = FastAPI(title="Weather Recommendation API")


@app.get("/")
async def root():
    return {"message": "Hello World"}

# sample recommend endpoint, would need to adjust based on store type
@app.get("/recommend/{city_name}") 
async def recommend(city_name: str):
    """
    Endpoint that returns recommendations for a given city.
    Internally calculates probabilities and passes them to the recommendation engine.
    """
    probabilities = get_event_probabilities(city_name)
    if not probabilities:
        raise HTTPException(status_code=404, detail=f"No weather data available for {city_name}")

    result = generate_recommendations(probabilities)
    return result
