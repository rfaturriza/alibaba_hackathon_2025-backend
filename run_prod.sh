#!/bin/bash
# Run index.js in the background for production
nohup node index.js > server.log 2>&1 &
echo $! > server.pid
echo "Server started in background. Logs: server.log, PID: $(cat server.pid)"
