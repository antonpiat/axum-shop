use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database Error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal Server Error: {0}")]
    InternalServerError(String),

    #[error("Missing authorization header")]
    MissingToken,
    
    #[error("Invalid authentication token")]
    InvalidToken,
    
    #[error("Conflict: {0}")]
    Conflict(String),
    
    #[error("Forbidden: {0}")]
    Forbidden(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, err_message) = match self {
            AppError::DatabaseError(ref e) => {
                tracing::error!("Database Error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database Error")
            }
            AppError::NotFound(ref msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::BadRequest(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::InternalServerError(ref msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.as_str()),
            AppError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization header"),
            AppError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid authentication token"),
            AppError::Conflict(ref msg) => (StatusCode::CONFLICT,  msg.as_str()),
            AppError::Forbidden(ref msg) => (StatusCode::FORBIDDEN,  msg.as_str()),
        };
        
        let body = Json(json!({
            "status": status.as_u16(),
            "error": err_message,
        }));

        (status, body).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
