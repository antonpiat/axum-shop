migrate-up:
	sqlx migrate run

migrate-down:
	sqlx migrate revert

start-server:
	RUST_LOG=debug cargo watch -c -w src/ -x run