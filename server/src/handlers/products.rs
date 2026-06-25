use std::sync::Arc;
use axum::{Json, response::IntoResponse, extract::{Path, Query, State}, Extension};
use axum_extra::extract::Multipart;
use serde_json::json;
use sqlx::{Postgres, QueryBuilder, Row};
use crate::error::AppError;
use crate::models::products::{CreateProductSchema, Paginated, Product, ProductQuery, UpdateProductSchema};
use crate::models::user::{User, UserRole};
use crate::openapi::{ErrorResponse, PaginatedProduct, UploadImageResponse};
use crate::state::AppState;

#[utoipa::path(
    get,
    path = "/api/products",
    tag = "Products",
    params(ProductQuery),
    responses(
        (status = 200, description = "Paginated product list", body = PaginatedProduct),
    )
)]
pub async fn get_page_products(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ProductQuery>,
) -> Result<impl IntoResponse, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(10).min(100);

    let offest = (page -1) * page_size;

    let mut count_builder: QueryBuilder<Postgres> =
        QueryBuilder::new("SELECT COUNT(*) As total FROM products WHERE 1=1");
    let mut list_builder: QueryBuilder<Postgres> =
        QueryBuilder::new("SELECT * FROM products WHERE 1=1");

    let append_filters = |builder: &mut QueryBuilder<Postgres>| {
        if let Some(ref s) = query.query {
            builder
                .push(" AND (name ILIKE ")
                .push_bind(format!("%{}%", s))
                .push(" OR description ILIKE ")
                .push_bind(format!("%{}%", s))
                .push(")");
        }
        if let Some(category_id) = query.category_id {
            builder
                .push(" AND category_id = ")
                .push_bind(category_id);
        }
        if let Some(min_price) = query.min_price {
            builder
                .push(" AND price >=")
                .push_bind(min_price);
        }
        if let Some(max_price) = query.max_price {
            builder
                .push(" AND price <=")
                .push_bind(max_price);
        }
    };

    append_filters(&mut count_builder);
    append_filters(&mut list_builder);

    let total_row = count_builder
        .build()
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;
    let total: i64 = total_row.get("total");

    list_builder
        .push(" ORDER BY id DESC LIMIT ")
        .push_bind(page_size)
        .push(" OFFSET ")
        .push_bind(offest);

    let rows = list_builder
        .build()
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    let items: Vec<Product> = rows
        .into_iter()
        .map(|item| Product {
            id: Some(item.get("id")),
            name: item.get("name"),
            description: item.get("description"),
            price: item.get("price"),
            category_id: item.get("category_id"),
            image_url: item.get("image_url"),
            stock: item.get("stock"),
            created_at: item.get("created_at"),
            updated_at: item.get("updated_at"),
        })
        .collect();

    let total_pages = if total == 0 {
        0
    } else {
        (total + page_size - 1) / page_size
    };

    Ok(Json(Paginated {
        items,
        page,
        page_size,
        total,
        total_pages,
    }))
}

#[utoipa::path(
    get,
    path = "/api/products/{id}",
    tag = "Products",
    params(("id" = i32, Path, description = "Product ID")),
    responses(
        (status = 200, description = "Product details", body = Product),
        (status = 404, description = "Product not found", body = ErrorResponse),
    )
)]
pub async fn get_product(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let product = sqlx::query_as!(
        Product,
        "SELECT * FROM products WHERE id = $1",
        id
    )
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(product))
}

#[utoipa::path(
    post,
    path = "/api/products",
    tag = "Products",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    request_body = CreateProductSchema,
    responses(
        (status = 200, description = "Product created", body = Product),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 403, description = "Admin role required", body = ErrorResponse),
    )
)]
pub async fn create_product(
    Extension(user): Extension<User>,
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateProductSchema>,
) -> Result<impl IntoResponse, AppError> {
    let user_role = user.role_enum().ok_or_else(|| AppError::NotFound("Role enum".into()))?;
    if user_role != UserRole::Admin {
        return Err(AppError::Forbidden("Not allowed".to_string()));
    }

    let product = sqlx::query_as!(
        Product,
        "INSERT INTO products (name, description, price, category_id, image_url, stock)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        body.name, body.description, body.price, body.category_id, body.image_url, body.stock
    )
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(product))
}

#[utoipa::path(
    put,
    path = "/api/products/{id}",
    tag = "Products",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    params(("id" = i32, Path, description = "Product ID")),
    request_body = UpdateProductSchema,
    responses(
        (status = 200, description = "Product updated", body = Product),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 403, description = "Admin role required", body = ErrorResponse),
    )
)]
pub async fn update_product(
    Extension(user): Extension<User>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateProductSchema>,
) -> Result<impl IntoResponse, AppError> {
    let user_role = user.role_enum().ok_or_else(|| AppError::NotFound("Role enum".into()))?;
    if user_role != UserRole::Admin {
        return Err(AppError::Forbidden("Not allowed".to_string()));
    }

    let product = sqlx::query_as!(
        Product,
        "UPDATE products SET name = COALESCE($2, name), description = COALESCE($3, description),
            price = COALESCE($4, price), category_id = COALESCE($5, category_id),
            image_url = COALESCE($6, image_url), stock = COALESCE($7, stock) WHERE id = $1 RETURNING *",
        id, body.name, body.description, body.price, body.category_id, body.image_url, body.stock
    )
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    Ok(Json(product))
}

#[utoipa::path(
    delete,
    path = "/api/products/{id}",
    tag = "Products",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    params(("id" = i32, Path, description = "Product ID")),
    responses(
        (status = 200, description = "Product deleted", body = String),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 403, description = "Admin role required", body = ErrorResponse),
        (status = 404, description = "Product not found", body = ErrorResponse),
    )
)]
pub async fn delete_product(
    Extension(user): Extension<User>,
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let user_role = user.role_enum().ok_or_else(|| AppError::NotFound("Role enum".into()))?;
    if user_role != UserRole::Admin {
        return Err(AppError::Forbidden("Not allowed".to_string()));
    }

    let res = sqlx::query!(
        "DELETE FROM products WHERE id = $1",
        id
    )
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e))?;

    if res.rows_affected() == 0 {
        return Err(AppError::NotFound("product not found".to_string()));
    }

    Ok(Json("Deleted successfully".to_string()))
}

#[utoipa::path(
    post,
    path = "/api/products/upload",
    tag = "Products",
    security(("cookie_auth" = []), ("bearer_auth" = [])),
    request_body(content_type = "multipart/form-data", description = "Image file field"),
    responses(
        (status = 200, description = "Image uploaded", body = UploadImageResponse),
        (status = 400, description = "No file provided", body = ErrorResponse),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
    )
)]
pub async fn upload_image(
    State(_state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let upload_dir = std::path::Path::new("./uploads");
    if !upload_dir.exists() {
        std::fs::create_dir_all(upload_dir).map_err(|e| AppError::InternalServerError(e.to_string()))?;
    }

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?
    {
        let file_name = field
            .file_name()
            .map(|s| s.to_string())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let file_path = upload_dir.join(&file_name);
        let data = field
            .bytes()
            .await
            .map_err(|e| AppError::InternalServerError(e.to_string()))?;
        tokio::fs::write(file_path, data)
            .await
            .map_err(|e| AppError::InternalServerError(e.to_string()))?;
        let url = format!("{}/{}", upload_dir.to_string_lossy(), file_name);

        return Ok(Json(json!({ "url": url })));
    }

    Err(AppError::BadRequest("No file provided".to_string()))
}