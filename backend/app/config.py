import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CivicEye AI"
    DEMO_MODE: bool = True
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./civiceye.db"
    
    SECRET_KEY: str = "civiceye-ai-hackathon-supersecret-jwt-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    ESCALATION_HOURS: int = 48
    ESCALATION_DEMO_MINUTES: int = 2
    
    DUPLICATE_RADIUS_METERS: float = 50.0
    DUPLICATE_CONFIDENCE_THRESHOLD: float = 65.0
    
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"
    
    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "escalations@civiceye.gov.in"
    MUNICIPAL_CHIEF_EMAIL: str = "commissioner@citycorp.gov.in"
    
    X_API_KEY: str = ""
    X_API_SECRET: str = ""
    X_ACCESS_TOKEN: str = ""
    X_ACCESS_TOKEN_SECRET: str = ""
    X_OFFICIAL_HANDLE: str = "@CityCorpCivic"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
