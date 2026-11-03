#!/usr/bin/env bash
# Stops the two dev servers of the demo: whoever listens on the demo ports, but only if it is an `rsbuild dev` process.
# (The npm wrapper's pid is not enough: rsbuild is re-parented, so it is found by its port.)
source "$(dirname "$0")/env.sh"
for port in "$NOW_PORT" "$CAND_PORT"; do
  for pid in $(ss -ltnp "sport = :$port" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u); do
    if tr '\0' ' ' </proc/"$pid"/cmdline 2>/dev/null | grep -q 'rsbuild.* dev'; then kill "$pid" && echo "stopped rsbuild on :$port (pid $pid)"
    else echo "port $port is used by pid $pid, which is not rsbuild: left alone"; fi
  done
done
rm -f "$STATE"/now.pid "$STATE"/candidate.pid
