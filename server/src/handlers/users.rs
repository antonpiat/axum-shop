use std::sync::Arc;
use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng}
};
use axum::{
    extract::State,
    http::header,
    response::{IntoResponse, Response},
    Json, Extension};
use axum_extra::extract::cookie::{Cookie, SameSite};
use humantime::parse_duration;
use jsonwebtoken::{encode, EncodingKey, Header};
use crate::error::AppError;
use crate::models::user::{FilteredUser, LoginUserSchema, RegisterUserSchema, TokenClaims, User};
use crate::openapi::ErrorResponse;
use crate::state::AppState;

#[utoipa::path(
    post,
    path = "/api/auth/register",
    tag = "Auth",
    request_body = RegisterUserSchema,
    responses(
        (status = 200, description = "User registered successfully", body = FilteredUser),
        (status = 409, description = "Email already exists or password mismatch", body = ErrorResponse),
    )
)]
pub async fn register_user(
    State(data): State<Arc<AppState>>,
    Json(body): Json<RegisterUserSchema>
) -> Result<impl IntoResponse, AppError> {
    let password_confirmed = body.password.eq(&body.confirm_password);

    if !password_confirmed {
        return Err(AppError::Conflict("Password confirmation does not match!".into()));
    }

    let user_exists: Option<bool> =
        sqlx::query_scalar("(SELECT EXISTS(SELECT 1 FROM users WHERE email = $1))")
            .bind(body.email.to_owned().to_ascii_lowercase())
            .fetch_one(&data.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e))?;

    if let Some(exists) = user_exists {
        if exists {
            return Err(AppError::Conflict(format!("User with name {} already exists", body.email)));
        }
    }

    let salt = SaltString::generate(&mut OsRng);
    let hash_password = Argon2::default()
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| AppError::InternalServerError(format!("Failed to hash password: {}", e)))
        .map(|hash| hash.to_string())?;

    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
        body.username, body.email, hash_password
    )
        .fetch_one(&data.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    let user_response = filter_user_record(&user);

    Ok(Json(user_response))
}

#[utoipa::path(
    post,
    path = "/api/auth/login",
    tag = "Auth",
    request_body = LoginUserSchema,
    responses(
        (status = 200, description = "Logged in successfully; sets HTTP-only `token` cookie", body = String),
        (status = 409, description = "Invalid credentials", body = ErrorResponse),
    )
)]
pub async fn login_user(
    State(data): State<Arc<AppState>>,
    Json(body): Json<LoginUserSchema>
) -> Result<impl IntoResponse, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE email = $1",
        body.email.to_ascii_lowercase()
    )
        .fetch_optional(&data.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?
        .ok_or_else(|| AppError::Conflict(format!("User with name {} not found", body.email)))?;

    let is_valid = match PasswordHash::new(&user.password) {
        Ok(parsed_hash) => Argon2::default()
            .verify_password(body.password.as_bytes(), &parsed_hash)
            .map_or(false, |_| true),
        Err(_) => false,
    };

    if !is_valid {
        return Err(AppError::Conflict("Password does not match!".into()));
    }

    let now = chrono::Utc::now();
    let duration = parse_duration(data.config.jwt_expires_in.as_ref()).unwrap();
    let claims = TokenClaims {
        sub: user.id.to_string(),
        iat: now.timestamp() as usize,
        exp: (now + chrono::Duration::from_std(duration).unwrap()).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(data.config.jwt_secret.as_ref())
    )
        .unwrap();

    let cookie = Cookie::build(("token", token.to_owned()))
        .path("/")
        .max_age(time::Duration::try_from(duration).unwrap())
        .same_site(SameSite::Lax)
        .http_only(true);

    let mut response = Response::new("Logged in successfully".to_string());
    response
        .headers_mut()
        .insert(header::SET_COOKIE, cookie.to_string().parse().unwrap());

    Ok(response)
}

#[utoipa::path(
    get,
    path = "/api/auth/logout",
    tag = "Auth",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    responses(
        (status = 200, description = "Logged out successfully; clears auth cookie", body = String),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
    )
)]
pub async fn logout_user() -> Result<impl IntoResponse, AppError> {
    let cookie = Cookie::build(("token", ""))
        .path("/")
        .max_age(time::Duration::hours(-1))
        .same_site(SameSite::Lax)
        .http_only(true);

    let mut response = Response::new("Logged out successfully".to_string());
    response
        .headers_mut()
        .insert(header::SET_COOKIE, cookie.to_string().parse().unwrap());

    Ok(response)
}

#[utoipa::path(
    get,
    path = "/api/auth/me",
    tag = "Auth",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    responses(
        (status = 200, description = "Current authenticated user", body = FilteredUser),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
    )
)]
pub async fn get_me(
    Extension(user): Extension<User>,
) -> Result<impl IntoResponse, AppError> {
    let response = filter_user_record(&user);

    Ok(Json(response))
}

fn filter_user_record(user: &User) -> FilteredUser {
    FilteredUser {
        id: user.id.to_string(),
        email: user.email.to_owned(),
        username: user.username.to_owned(),
        photo: user.photo.to_owned(),
        role: user.role_enum().unwrap(),
        verified: user.verified,
        createdAt: user.created_at.unwrap(),
        updatedAt: user.updated_at.unwrap(),
    }
}