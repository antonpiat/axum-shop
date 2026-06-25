use std::sync::Arc;
use axum::{middleware, routing::{get, post, put}, Router};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use crate::handlers::{
    users::*,
    categories::*,
    products::*,
};
use crate::jwt_auth::auth_middleware;
use crate::openapi::ApiDoc;
use crate::state::AppState;

pub fn create_router(app_state: Arc<AppState>) -> Router {
    let swagger = Router::new().merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()));

    let public_router = Router::new()
        .route("/api/auth/register", post(register_user))
        .route("/api/auth/login", post(login_user))
        .route("/api/categories", get(get_all_categories))
        .route("/api/categories/{id}", get(get_category))
        .route("/api/products", get(get_page_products))
        .route("/api/products/{id}", get(get_product));

    let protected_router = Router::new()
        // Auth routes
        .route("/api/auth/logout", get(logout_user))
        .route("/api/auth/me", get(get_me))
        // Category routes
        .route("/api/categories", post(create_category))
        .route("/api/categories/{id}", put(update_category).delete(delete_category))
        // Product routes
        .route("/api/products", post(create_product))
        .route("/api/products/{id}", put(update_product).delete(delete_product))
        .route("/api/products/upload", post(upload_image))
        .route_layer(middleware::from_fn_with_state(app_state.clone(), auth_middleware));

    public_router
        .merge(protected_router)
        .merge(swagger)
        .with_state(app_state)
}