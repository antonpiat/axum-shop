use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, Clone, Debug, PartialEq, Eq, sqlx::Type, ToSchema)]
#[sqlx(type_name = "role")]
pub enum UserRole {
    Admin,
    User,
    Guest,
}

impl UserRole {
    fn from_str(s: &str) -> Option<Self> {
        match s {
            "admin" => Some(UserRole::Admin),
            "user" => Some(UserRole::User),
            "guest" => Some(UserRole::Guest),
            _ => None,
        }
    }
}

impl User {
    pub fn role_enum(&self) -> Option<UserRole> {
        UserRole::from_str(&self.role)
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct User {
    pub id: uuid::Uuid,
    pub username: String,
    pub email: String,
    pub password: String,
    pub role: String,
    pub photo: String,
    pub verified: bool,
    #[serde(rename = "createdAt")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String,
    pub iat: usize,
    pub exp: usize,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RegisterUserSchema {
    pub username: String,
    pub email: String,
    pub password: String,
    pub confirm_password: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct LoginUserSchema {
    pub email: String,
    pub password: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, ToSchema)]
pub struct FilteredUser {
    pub id: String,
    pub username: String,
    pub email: String,
    pub role: UserRole,
    pub photo: String,
    pub verified: bool,
    pub createdAt: DateTime<Utc>,
    pub updatedAt: DateTime<Utc>,
}