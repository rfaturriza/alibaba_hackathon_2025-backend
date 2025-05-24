#!/bin/bash
# Restart the background node server
if [ -f server.pid ]; then
  PID=$(cat server.pid)
  if kill -0 $PID 2>/dev/null; then
    echo "Stopping server with PID $PID..."
    kill $PID
    sleep 1
  fi
  rm server.pid
fi
nohup node index.js > server.log 2>&1 &
echo $! > server.pid
echo "Server restarted in background. Logs: server.log, PID: $(cat server.pid)"
