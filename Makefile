build:
	@npm run build

install:
ifeq ($(SOCKETIO_VERSION),)
	@npm install
else
	@npm install socket.io@$(SOCKETIO_VERSION)
	@npm install socket.io-client@$(SOCKETIO_VERSION)
endif

test:
	@npm test

.PHONY: build install test
