from dotenv.main import DotEnv

import uvicorn


if __name__ == "__main__":
    env = DotEnv(".env").dict()
    uvicorn.run(
        "src:app",
        host=env.get("HOST", "0.0.0.0"),
        port=int(env.get("PORT", "5000")),
        reload=bool(int(env.get("DEV", "1"))),
        env_file=".env"
    )
