use utoipa::openapi::security::{ApiKey, ApiKeyValue, HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

use crate::handlers::{categories::*, products::*, users::*};
use crate::models::categories::{Category, CreateCategorySchema, UpdateCategorySchema};
use crate::models::products::{
    CreateProductSchema, Product, ProductQuery, UpdateProductSchema,
};
use crate::models::user::{FilteredUser, LoginUserSchema, RegisterUserSchema, UserRole};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Axum Shop API",
        version = "0.1.0",
        description = "REST API for the Axum Shop e-commerce backend. Authentication uses an HTTP-only cookie or Bearer JWT after login.",
        contact(name = "Axum Shop")
    ),
    paths(
        register_user,
        login_user,
        logout_user,
        get_me,
        get_all_categories,
        get_category,
        create_category,
        update_category,
        delete_category,
        get_page_products,
        get_product,
        create_product,
        update_product,
        delete_product,
        upload_image,
    ),
    components(
        schemas(
            RegisterUserSchema,
            LoginUserSchema,
            FilteredUser,
            UserRole,
            Category,
            CreateCategorySchema,
            UpdateCategorySchema,
            Product,
            ProductQuery,
            CreateProductSchema,
            UpdateProductSchema,
            PaginatedProduct,
            UploadImageResponse,
            ErrorResponse,
        )
    ),
    tags(
        (name = "Auth", description = "Registration, login, and session management"),
        (name = "Categories", description = "Product category management"),
        (name = "Products", description = "Product catalog and inventory"),
    ),
    modifiers(&SecurityAddon),
)]
pub struct ApiDoc;

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct PaginatedProduct {
    pub items: Vec<Product>,
    pub page: i64,
    pub page_size: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct UploadImageResponse {
    pub url: String,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct ErrorResponse {
    pub status: u16,
    pub error: String,
}

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_with(Default::default);
        components.add_security_scheme(
            "cookie_auth",
            SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::new("token"))),
        );
        components.add_security_scheme(
            "bearer_auth",
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("JWT")
                    .build(),
            ),
        );
    }
}
