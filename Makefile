SHELL := /bin/zsh

.PHONY: help check test smoke native-build native-test web-install web-check web-test web-smoke web-dry-run

help:
	@printf "%s\n" \
		"make check       - Build the Swift app and run web syntax/type checks" \
		"make test        - Run Swift and web tests" \
		"make smoke       - Run static asset and live API smoke checks" \
		"make web-install - Install web dependencies" \
		"make web-dry-run - Validate the Wrangler deploy config"

check: native-build web-check

test: native-test web-test

smoke: web-smoke

native-build:
	cd app && swift build

native-test:
	cd app && swift test

web-install:
	cd web && npm install

web-check:
	cd web && npm run check

web-test:
	cd web && npm test

web-smoke:
	cd web && npm run smoke

web-dry-run:
	cd web && npm run dry-run
