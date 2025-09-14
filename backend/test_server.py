from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/api/patients")
def get_patients():
    return [{"id": "1", "name": "Test Patient"}]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
