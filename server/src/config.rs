use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expires_in: String,
    pub host: String,
    pub port: u16,
}

impl Config {
    pub fn init() -> anyhow::Result<Self> {
        Ok(Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| {
                    "postgresql://user:password@localhost:5432/db_name".to_string()
                }),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "jwt_secret".to_string()),
            jwt_expires_in: env::var("JWT_EXPIRED_IN").unwrap_or_else(|_| "60m".to_string()),
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            port: env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse()?,
        })
    }
}