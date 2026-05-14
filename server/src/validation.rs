use crate::error::{AppError, Result};

const MAX_LENGTH: usize = 200;

/// Validate that string is not empty or exceed MAX_LENGTH
pub fn validate_string(value: &str, field_name: &str) -> Result<()> {
    if value.len() > MAX_LENGTH {
        return Err(AppError::BadRequest(format!(
            "{} must not exceed {} letters but got {}",
            field_name, MAX_LENGTH, value.len()
        )));
    }
    
    if value.is_empty() {
        return Err(AppError::BadRequest(format!("{} must not be empty", field_name)));
    }
    
    Ok(())
}

/// Validate an optional string, if Some, must not exceed MAX_LENGTH
pub fn validate_optional_string(value: &Option<String>, field_name: &str) -> Result<()> {
    if let Some(s) = value {
        if s.len() > MAX_LENGTH {
            return Err(AppError::BadRequest(format!(
                "{} must not exceed {} letters but got {}",
                field_name, MAX_LENGTH, s.len()
            )))
        }
    }
    
    Ok(())
}