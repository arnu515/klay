import os

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "src:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        reload=bool(int(os.getenv("DEV", "1"))),
        env_file=".env"
    )
