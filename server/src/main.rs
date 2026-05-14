use std::sync::Arc;
use axum::http::{
    HeaderValue, Method,
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE}
};
use sqlx::postgres::PgPoolOptions;
use tower::ServiceBuilder;
use tower_http::{compression::CompressionLayer, cors::CorsLayer, services::ServeDir, trace::TraceLayer,};
use tracing_subscriber::{fmt, registry, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};
use crate::config::Config;
use crate::routes::create_router;
use crate::state::AppState;

pub mod error;
pub mod config;
pub mod state;
pub mod validation;
pub mod jwt_auth;
pub mod models;
pub mod handlers;
pub mod routes;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();

    registry()
        .with(EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "ultimatelister_api=debug,tower_http=debug".into()))
        .with(fmt::layer())
        .init();

    let config = Config::init()?;
    tracing::info!("Starting server on {}:{}", config.host, config.port);

    let pool = match PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
    {
        Ok(pool) => {
            tracing::info!("Connected to database");
            pool
        },
        Err(err) => {
            tracing::error!("Failed to connect to database: {:?}", err);
            std::process::exit(1);
        }
    };

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>()?)
        .allow_methods(vec![Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_credentials(true)
        .allow_headers(vec![AUTHORIZATION, ACCEPT, CONTENT_TYPE]);
    let trace = TraceLayer::new_for_http();
    let compression = CompressionLayer::new();

    let app = create_router(Arc::new(AppState {
        pool: pool.clone(),
        config: config.clone()
    }))
        .nest_service("/uploads", ServeDir::new("./uploads"))
        .layer(
            ServiceBuilder::new()
                .layer(trace)
                .layer(cors)
                .layer(compression)
        );

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", config.host, config.port)).await?;
    tracing::info!("Server listening on {}", listener.local_addr()?);

    axum::serve(listener, app).await?;

    Ok(())
}