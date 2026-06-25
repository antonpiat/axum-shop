use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow, ToSchema)]
pub struct Product {
    pub id: Option<i32>,
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub category_id: Option<i32>,
    pub image_url: Option<String>,
    pub stock: i32,
    #[serde(rename = "createdAt")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, IntoParams, ToSchema)]
pub struct ProductQuery {
    pub query: Option<String>,
    pub category_id: Option<i32>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub page: Option<i64>,
    #[serde(alias = "pageSize")]
    pub page_size: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct Paginated<T> where T: Serialize {
    pub items: Vec<T>,
    pub page: i64,
    pub page_size: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateProductSchema {
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub category_id: Option<i32>,
    pub stock: i32,
    pub image_url: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateProductSchema {
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub category_id: Option<i32>,
    pub stock: i32,
    pub image_url: Option<String>,
}