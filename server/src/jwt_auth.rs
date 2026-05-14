use std::sync::Arc;
use axum::{
    extract::State,
    http::{header, Request},
    middleware::Next,
    response::IntoResponse,
    body::Body,
};
use axum_extra::extract::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use uuid::Uuid;
use crate::error::AppError;
use crate::models::user::{User, TokenClaims};
use crate::state::AppState;

pub async fn auth_middleware(
    cookie_jar: CookieJar,
    State(data): State<Arc<AppState>>,
    mut req: Request<Body>,
    next: Next,
) -> Result<impl IntoResponse, AppError> {
    let token = cookie_jar
        .get("token")
        .map(|cookie| cookie.value().to_string())
        .or_else(|| {
            req.headers()
                .get(header::AUTHORIZATION)
                .and_then(|header| header.to_str().ok())
                .and_then(|auth_value| {
                    if auth_value.starts_with("Bearer ") {
                        Some(auth_value[7..].to_string())
                    } else {
                        None
                    }
                })
        });
    
    let token = token.ok_or_else(|| AppError::MissingToken);
    
    let claims = decode::<TokenClaims>(
        &token.unwrap(),
        &DecodingKey::from_secret(data.config.jwt_secret.as_ref()),
        &Validation::default(),
    )
        .map_err(|_| AppError::InvalidToken)?
        .claims;
    
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::InvalidToken)?;

    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", user_id)
        .fetch_optional(&data.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    let user = user.ok_or_else(|| AppError::NotFound("User not found".into()))?;

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}