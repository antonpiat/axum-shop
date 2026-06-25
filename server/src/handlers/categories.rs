use std::sync::Arc;
use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json, Extension
};
use crate::error::AppError;
use crate::state::AppState;
use crate::models::categories::{Category, CreateCategorySchema, UpdateCategorySchema};
use crate::models::user::{User, UserRole};
use crate::openapi::ErrorResponse;

#[utoipa::path(
    get,
    path = "/api/categories",
    tag = "Categories",
    responses(
        (status = 200, description = "List all categories", body = Vec<Category>),
    )
)]
pub async fn get_all_categories(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let categories = sqlx::query_as!(Category, "SELECT * FROM categories ORDER BY id DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(categories))
}

#[utoipa::path(
    get,
    path = "/api/categories/{id}",
    tag = "Categories",
    params(("id" = i32, Path, description = "Category ID")),
    responses(
        (status = 200, description = "Category details", body = Category),
        (status = 404, description = "Category not found", body = ErrorResponse),
    )
)]
pub async fn get_category(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let category = sqlx::query_as!(Category, "SELECT * FROM categories WHERE id = $1", id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(category))
}

#[utoipa::path(
    post,
    path = "/api/categories",
    tag = "Categories",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    request_body = CreateCategorySchema,
    responses(
        (status = 200, description = "Category created", body = Category),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 403, description = "Admin role required", body = ErrorResponse),
    )
)]
pub async fn create_category(
    Extension(user): Extension<User>,
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateCategorySchema>,
) -> Result<impl IntoResponse, AppError> {
    let user_role = user.role_enum().ok_or_else(|| AppError::NotFound("Role enum".into()))?;
    if user_role != UserRole::Admin {
        return Err(AppError::Forbidden("Not allowed".to_string()));
    }

    let category = sqlx::query_as!(
        Category,
        "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
        body.name, body.description
    )
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;
    
   Ok(Json(category))
}

#[utoipa::path(
    put,
    path = "/api/categories/{id}",
    tag = "Categories",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    params(("id" = i32, Path, description = "Category ID")),
    request_body = UpdateCategorySchema,
    responses(
        (status = 200, description = "Category updated", body = Category),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 403, description = "Admin role required", body = ErrorResponse),
    )
)]
pub async fn update_category(
    Extension(user): Extension<User>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateCategorySchema>,
) -> Result<impl IntoResponse, AppError> {
    let user_role = user.role_enum().ok_or_else(|| AppError::NotFound("Role enum".into()))?;
    if user_role != UserRole::Admin {
        return Err(AppError::Forbidden("Not allowed".to_string()));
    }

    let category = sqlx::query_as!(
        Category,
        "UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *",
        body.name, body.description, id
    )
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(category))
}

#[utoipa::path(
    delete,
    path = "/api/categories/{id}",
    tag = "Categories",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    params(("id" = i32, Path, description = "Category ID")),
    responses(
        (status = 200, description = "Category deleted", body = String),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 403, description = "Admin role required", body = ErrorResponse),
        (status = 404, description = "Category not found", body = ErrorResponse),
    )
)]
pub async fn delete_category(
    Extension(user): Extension<User>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_role = user.role_enum().ok_or_else(|| AppError::NotFound("Role enum".into()))?;
    if user_role != UserRole::Admin {
        return Err(AppError::Forbidden("Not allowed".to_string()));
    }

    let res = sqlx::query!(
        "DELETE FROM categories WHERE id = $1",
        id
    )
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound("Category not found".to_string()));
    }

    Ok(Json("Deleted successfully"))
}