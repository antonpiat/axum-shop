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

pub async fn get_all_categories(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let categories = sqlx::query_as!(Category, "SELECT * FROM categories ORDER BY id DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(categories))
}

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