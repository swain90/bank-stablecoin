#!/bin/bash

echo "=========================================="
echo "Checking Daml JSON API Configuration"
echo "=========================================="
echo ""

# Check if JSON API is running
echo "1. Checking if JSON API is running on port 7575..."
if curl -s http://localhost:7575/livez > /dev/null 2>&1; then
    echo "✓ JSON API is running"
else
    echo "✗ JSON API is not responding"
    exit 1
fi

echo ""
echo "2. Checking JSON API process..."
ps aux | grep -i "json-api" | grep -v grep

echo ""
echo "3. Testing unauthenticated query..."
curl -s -X POST http://localhost:7575/v1/query \
  -H "Content-Type: application/json" \
  -d '{"templateIds": [], "query": {}}' | head -c 200

echo ""
echo ""
echo "4. Testing with party as token..."
PARTY_ID="party-test"
curl -s -X POST http://localhost:7575/v1/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PARTY_ID}" \
  -d '{"templateIds": [], "query": {}}' | head -c 200

echo ""
echo ""
echo "=========================================="
echo "Check the terminal running 'daml start'"
echo "for JSON API startup parameters"
echo "=========================================="