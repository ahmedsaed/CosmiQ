import requests

response = requests.post(
    "http://localhost:5055/api/models",
    json={
        "name": "text-embedding-004",
        "provider": "google",
        "type": "embedding"
    }
)

if response.ok:
    model = response.json()
    model_id = model["id"]
    print(f"Created embedding model: {model_id}")
    
    response2 = requests.put(
        "http://localhost:5055/api/models/defaults",
        json={
            "default_embedding_model": model_id
        }
    )
    
    if response2.ok:
        print("Set as default embedding model")
        print("\nEmbedding model is now configured!")
    else:
        print(f"Failed to set default: {response2.text}")
else:
    print(f"Failed to create model: {response.text}")